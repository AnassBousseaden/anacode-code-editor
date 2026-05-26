import { derived, type Readable, type Unsubscriber, writable, type Writable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	DraftStatus,
	ISavableEditorDocument
} from '$lib/core/editor/document/savable-editor-document';
import { DraftStatusKind } from '$lib/core/editor/document/savable-editor-document';
import type { IObservableEditorDocumentRegistry } from '$lib/core/editor/document-registry/editor-document-registry';
import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';

const LOG_SCOPE: string = 'editor-save-service';
import {
	type DirtyEntry,
	type EditorSaveAllError,
	type EditorSaveDraftConflictedError,
	type EditorSaveDraftInvalidError,
	type EditorSaveError,
	type EditorSaveReadOnlyError,
	EditorSaveServiceErrorKind,
	type EditorSaveState,
	EditorSaveStatus,
	type EditorSaveTargetFailure,
	type IEditorSaveService
} from '$lib/core/editor/save/editor-save-service';
import { SaveEntryKind } from '$lib/core/editor/save/registry/draft-registry';
import type {
	DocumentForceWriteError,
	DocumentSaveError
} from '$lib/core/editor/document/savable-editor-document';
import {
	DocumentForceWriteErrorKind,
	DocumentSaveErrorKind
} from '$lib/core/editor/document/savable-editor-document';

interface DocSubscription {
	readonly unsubscribeStatus: Unsubscriber;
	readonly unsubscribePending: Unsubscriber;
}

interface AggregateBuckets {
	readonly dirty: Set<NodeID>;
	readonly saveable: Set<NodeID>;
	readonly conflicted: Set<NodeID>;
	readonly invalid: Set<NodeID>;
	readonly pendingSave: Set<NodeID>;
}

const EMPTY_NODE_IDS: ReadonlyArray<NodeID> = [];

const ErrorMessages = {
	DRAFT_CONFLICTED: (nodeID: NodeID): string => `Cannot save node ${nodeID}: draft is conflicted.`,
	DRAFT_INVALID: (nodeID: NodeID): string => `Cannot save node ${nodeID}: draft is invalid.`,
	READ_ONLY: (nodeID: NodeID): string => `Cannot save node ${nodeID}: target is read-only.`,
	PERSISTENCE: (nodeID: NodeID, message: string): string =>
		`Failed to persist node ${nodeID}: ${message}`,
	SAVE_ALL_PARTIAL: (failedNodeIDs: ReadonlyArray<NodeID>): string =>
		`Save failed for nodes: ${failedNodeIDs.join(', ')}`,
	INTERNAL_ERROR: (message: string): string => `Unexpected editor save error: ${message}`
} as const;

export class EditorSaveService implements IEditorSaveService {
	public readonly state: Readable<EditorSaveState>;
	public readonly dirtyNodeIDs: Readable<ReadonlyArray<NodeID>>;
	public readonly dirtyEntries: Readable<ReadonlyArray<DirtyEntry>>;
	public readonly saveableNodeIDs: Readable<ReadonlyArray<NodeID>>;
	public readonly conflictedNodeIDs: Readable<ReadonlyArray<NodeID>>;
	public readonly invalidNodeIDs: Readable<ReadonlyArray<NodeID>>;

	private readonly documentRegistry: IObservableEditorDocumentRegistry;
	private readonly logger: IEditorLogger;
	private readonly buckets: AggregateBuckets;

	private readonly _dirtyNodeIDs: Writable<ReadonlyArray<NodeID>>;
	private readonly _saveableNodeIDs: Writable<ReadonlyArray<NodeID>>;
	private readonly _conflictedNodeIDs: Writable<ReadonlyArray<NodeID>>;
	private readonly _invalidNodeIDs: Writable<ReadonlyArray<NodeID>>;
	private readonly _pendingSaveCount: Writable<number>;

	private readonly docSubscriptions: Map<NodeID, DocSubscription>;
	private readonly documentsUnsubscribe: Unsubscriber;

	public constructor(
		documentRegistry: IObservableEditorDocumentRegistry,
		logger: IEditorLogger
	) {
		this.documentRegistry = documentRegistry;
		this.logger = logger;
		this.buckets = {
			dirty: new Set<NodeID>(),
			saveable: new Set<NodeID>(),
			conflicted: new Set<NodeID>(),
			invalid: new Set<NodeID>(),
			pendingSave: new Set<NodeID>()
		};
		this.docSubscriptions = new Map<NodeID, DocSubscription>();

		this._dirtyNodeIDs = writable<ReadonlyArray<NodeID>>(EMPTY_NODE_IDS);
		this._saveableNodeIDs = writable<ReadonlyArray<NodeID>>(EMPTY_NODE_IDS);
		this._conflictedNodeIDs = writable<ReadonlyArray<NodeID>>(EMPTY_NODE_IDS);
		this._invalidNodeIDs = writable<ReadonlyArray<NodeID>>(EMPTY_NODE_IDS);
		this._pendingSaveCount = writable<number>(0);

		this.dirtyNodeIDs = this._dirtyNodeIDs;
		this.saveableNodeIDs = this._saveableNodeIDs;
		this.conflictedNodeIDs = this._conflictedNodeIDs;
		this.invalidNodeIDs = this._invalidNodeIDs;

		this.dirtyEntries = derived(
			[this._saveableNodeIDs, this._conflictedNodeIDs, this._invalidNodeIDs],
			([saveable, conflicted, invalid]: [
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>
			]): ReadonlyArray<DirtyEntry> => {
				const entries: DirtyEntry[] = [];
				for (const nodeID of saveable) {
					entries.push({ nodeID: nodeID, status: SaveEntryKind.SAVEABLE });
				}
				for (const nodeID of conflicted) {
					entries.push({ nodeID: nodeID, status: SaveEntryKind.CONFLICTED });
				}
				for (const nodeID of invalid) {
					entries.push({ nodeID: nodeID, status: SaveEntryKind.INVALID });
				}
				return entries;
			}
		);

		this.state = derived(
			[
				this._dirtyNodeIDs,
				this._saveableNodeIDs,
				this._conflictedNodeIDs,
				this._invalidNodeIDs,
				this._pendingSaveCount
			],
			([dirty, saveable, conflicted, invalid, pendingCount]: [
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>,
				number
			]): EditorSaveState => {
				const status: EditorSaveStatus =
					pendingCount > 0 ? EditorSaveStatus.SAVING : EditorSaveStatus.IDLE;
				const canSaveAll: boolean = saveable.length > 0 && pendingCount === 0;
				const nextState: EditorSaveState = {
					status: status,
					canSaveAll: canSaveAll,
					dirtyCount: dirty.length,
					saveableCount: saveable.length,
					conflictedCount: conflicted.length,
					invalidCount: invalid.length,
					lastFailure: null
				};
				return nextState;
			}
		);

		this.documentsUnsubscribe = this.documentRegistry.documents.subscribe(
			(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void => {
				this.reconcileDocSubscriptions(documents);
			}
		);
	}

	public async save(nodeID: NodeID): Promise<Result<void, EditorSaveError>> {
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'save.requested',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});

		const doc: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);
		if (doc === null) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'save.no_doc',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			return success<void>(undefined);
		}
		const result: Result<void, DocumentSaveError> = await doc.save();
		if (result.ok) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'save.completed',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			return success<void>(undefined);
		}
		const mappedError: EditorSaveTargetFailure = mapSaveError(nodeID, result.error);
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'save.failed',
			level: EditorLogLevel.WARN,
			data: {
				nodeID: nodeID,
				errorKind: mappedError.kind,
				errorMessage: mappedError.message
			}
		});
		return failure(mappedError);
	}

	public async saveAll(): Promise<Result<void, EditorSaveError>> {
		const snapshotNodeIDs: ReadonlyArray<NodeID> = Array.from(this.buckets.saveable);
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'save_all.requested',
			level: EditorLogLevel.INFO,
			data: { saveableCount: snapshotNodeIDs.length }
		});

		if (snapshotNodeIDs.length === 0) {
			return success<void>(undefined);
		}

		const failures: EditorSaveTargetFailure[] = [];

		for (const nodeID of snapshotNodeIDs) {
			const doc: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);
			if (doc === null) {
				continue;
			}
			const result: Result<void, DocumentSaveError> = await doc.save();
			if (!result.ok) {
				failures.push(mapSaveError(nodeID, result.error));
			}
		}

		if (failures.length > 0) {
			const failedNodeIDs: ReadonlyArray<NodeID> = failures.map(
				(failureEntry: EditorSaveTargetFailure): NodeID => failureEntry.nodeID
			);
			const partialError: EditorSaveAllError = {
				kind: EditorSaveServiceErrorKind.SAVE_ALL_PARTIAL,
				message: ErrorMessages.SAVE_ALL_PARTIAL(failedNodeIDs),
				failures: failures
			};
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'save_all.partial',
				level: EditorLogLevel.WARN,
				data: {
					attemptedCount: snapshotNodeIDs.length,
					failedCount: failures.length
				}
			});
			return failure(partialError);
		}

		this.logger.log({
			scope: LOG_SCOPE,
			event: 'save_all.completed',
			level: EditorLogLevel.INFO,
			data: { savedCount: snapshotNodeIDs.length }
		});
		return success<void>(undefined);
	}

	public async overwrite(nodeID: NodeID): Promise<Result<void, EditorSaveError>> {
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'overwrite.requested',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});

		const doc: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);
		if (doc === null) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'overwrite.no_doc',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			return success<void>(undefined);
		}
		const result: Result<void, DocumentForceWriteError> = await doc.forceWrite();
		if (result.ok) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'overwrite.completed',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			return success<void>(undefined);
		}
		const mappedError: EditorSaveTargetFailure = mapForceWriteError(nodeID, result.error);
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'overwrite.failed',
			level: EditorLogLevel.WARN,
			data: {
				nodeID: nodeID,
				errorKind: mappedError.kind,
				errorMessage: mappedError.message
			}
		});
		return failure(mappedError);
	}

	public dispose(): void {
		this.documentsUnsubscribe();
		for (const subscription of this.docSubscriptions.values()) {
			subscription.unsubscribeStatus();
			subscription.unsubscribePending();
		}
		this.docSubscriptions.clear();
		this.buckets.dirty.clear();
		this.buckets.saveable.clear();
		this.buckets.conflicted.clear();
		this.buckets.invalid.clear();
		this.buckets.pendingSave.clear();
	}

	private reconcileDocSubscriptions(
		documents: ReadonlyMap<NodeID, ISavableEditorDocument>
	): void {
		const removedNodeIDs: NodeID[] = [];
		for (const nodeID of this.docSubscriptions.keys()) {
			if (!documents.has(nodeID)) {
				removedNodeIDs.push(nodeID);
			}
		}
		for (const nodeID of removedNodeIDs) {
			this.unsubscribeDoc(nodeID);
		}

		for (const [nodeID, doc] of documents) {
			if (this.docSubscriptions.has(nodeID)) {
				continue;
			}
			this.subscribeDoc(nodeID, doc);
		}
	}

	private subscribeDoc(nodeID: NodeID, doc: ISavableEditorDocument): void {
		const unsubscribeStatus: Unsubscriber = doc.draftStatus.subscribe(
			(status: DraftStatus): void => {
				this.updateStatusBuckets(nodeID, status);
				this.publishStatusBuckets();
			}
		);
		const unsubscribePending: Unsubscriber = doc.pendingSave.subscribe(
			(pending: boolean): void => {
				this.updatePendingBucket(nodeID, pending);
				this.publishPendingCount();
			}
		);
		this.docSubscriptions.set(nodeID, {
			unsubscribeStatus: unsubscribeStatus,
			unsubscribePending: unsubscribePending
		});
	}

	private unsubscribeDoc(nodeID: NodeID): void {
		const subscription: DocSubscription | undefined = this.docSubscriptions.get(nodeID);
		if (subscription === undefined) {
			return;
		}
		subscription.unsubscribeStatus();
		subscription.unsubscribePending();
		this.docSubscriptions.delete(nodeID);
		this.removeFromAllStatusBuckets(nodeID);
		if (this.buckets.pendingSave.has(nodeID)) {
			this.buckets.pendingSave.delete(nodeID);
			this.publishPendingCount();
		}
		this.publishStatusBuckets();
	}

	private updateStatusBuckets(nodeID: NodeID, status: DraftStatus): void {
		this.removeFromAllStatusBuckets(nodeID);
		switch (status.kind) {
			case DraftStatusKind.CLEAN:
				return;
			case DraftStatusKind.SAVEABLE:
				this.buckets.dirty.add(nodeID);
				this.buckets.saveable.add(nodeID);
				return;
			case DraftStatusKind.CONFLICTED:
				this.buckets.dirty.add(nodeID);
				this.buckets.conflicted.add(nodeID);
				return;
			case DraftStatusKind.INVALID:
				this.buckets.dirty.add(nodeID);
				this.buckets.invalid.add(nodeID);
				return;
		}
	}

	private removeFromAllStatusBuckets(nodeID: NodeID): void {
		this.buckets.dirty.delete(nodeID);
		this.buckets.saveable.delete(nodeID);
		this.buckets.conflicted.delete(nodeID);
		this.buckets.invalid.delete(nodeID);
	}

	private updatePendingBucket(nodeID: NodeID, pending: boolean): void {
		if (pending) {
			this.buckets.pendingSave.add(nodeID);
		} else {
			this.buckets.pendingSave.delete(nodeID);
		}
	}

	private publishStatusBuckets(): void {
		this._dirtyNodeIDs.set(Array.from(this.buckets.dirty));
		this._saveableNodeIDs.set(Array.from(this.buckets.saveable));
		this._conflictedNodeIDs.set(Array.from(this.buckets.conflicted));
		this._invalidNodeIDs.set(Array.from(this.buckets.invalid));
	}

	private publishPendingCount(): void {
		this._pendingSaveCount.set(this.buckets.pendingSave.size);
	}
}

function mapSaveError(nodeID: NodeID, docError: DocumentSaveError): EditorSaveTargetFailure {
	if (docError.kind === DocumentSaveErrorKind.CONFLICTED) {
		const conflictedError: EditorSaveDraftConflictedError = {
			kind: EditorSaveServiceErrorKind.DRAFT_CONFLICTED,
			message: ErrorMessages.DRAFT_CONFLICTED(nodeID),
			nodeID: nodeID
		};
		return conflictedError;
	}
	if (docError.kind === DocumentSaveErrorKind.INVALID) {
		const invalidError: EditorSaveDraftInvalidError = {
			kind: EditorSaveServiceErrorKind.DRAFT_UNRESOLVED,
			message: ErrorMessages.DRAFT_INVALID(nodeID),
			nodeID: nodeID
		};
		return invalidError;
	}
	if (docError.kind === DocumentSaveErrorKind.READ_ONLY) {
		const readOnlyError: EditorSaveReadOnlyError = {
			kind: EditorSaveServiceErrorKind.READ_ONLY,
			message: ErrorMessages.READ_ONLY(nodeID),
			nodeID: nodeID
		};
		return readOnlyError;
	}
	const fallbackError: EditorSaveDraftInvalidError = {
		kind: EditorSaveServiceErrorKind.DRAFT_UNRESOLVED,
		message: ErrorMessages.PERSISTENCE(nodeID, docError.message),
		nodeID: nodeID
	};
	return fallbackError;
}

function mapForceWriteError(
	nodeID: NodeID,
	docError: DocumentForceWriteError
): EditorSaveTargetFailure {
	if (docError.kind === DocumentForceWriteErrorKind.NOT_CONFLICTED) {
		const conflictedError: EditorSaveDraftConflictedError = {
			kind: EditorSaveServiceErrorKind.DRAFT_CONFLICTED,
			message: ErrorMessages.DRAFT_CONFLICTED(nodeID),
			nodeID: nodeID
		};
		return conflictedError;
	}
	if (docError.kind === DocumentForceWriteErrorKind.INVALID) {
		const invalidError: EditorSaveDraftInvalidError = {
			kind: EditorSaveServiceErrorKind.DRAFT_UNRESOLVED,
			message: ErrorMessages.DRAFT_INVALID(nodeID),
			nodeID: nodeID
		};
		return invalidError;
	}
	if (docError.kind === DocumentForceWriteErrorKind.READ_ONLY) {
		const readOnlyError: EditorSaveReadOnlyError = {
			kind: EditorSaveServiceErrorKind.READ_ONLY,
			message: ErrorMessages.READ_ONLY(nodeID),
			nodeID: nodeID
		};
		return readOnlyError;
	}
	const fallbackError: EditorSaveDraftInvalidError = {
		kind: EditorSaveServiceErrorKind.DRAFT_UNRESOLVED,
		message: ErrorMessages.PERSISTENCE(nodeID, docError.message),
		nodeID: nodeID
	};
	return fallbackError;
}
