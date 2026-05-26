import { type Unsubscriber, type Writable, writable, type Readable } from 'svelte/store';

import type {
	DocumentForceWriteError,
	DocumentRevertError,
	DraftStatus,
	DraftRevision,
	ISavableEditorDocument
} from '$lib/core/editor/document/savable-editor-document';
import {
	DocumentForceWriteErrorKind,
	DocumentRevertErrorKind,
	DraftStatusKind
} from '$lib/core/editor/document/savable-editor-document';
import type { IObservableEditorDocumentRegistry } from '$lib/core/editor/document-registry/editor-document-registry';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	IConflictResolutionService,
	OverwriteConflictError,
	ReloadConflictError
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import {
	OverwriteConflictErrorKind,
	OverwriteConflictErrorMessages,
	ReloadConflictErrorKind,
	ReloadConflictErrorMessages
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import type { ConflictItem } from '$lib/core/editor/conflict-resolution/conflict-resolution-models';
import { get } from 'svelte/store';
import { failure, success, type Result } from '$lib/core/shared/models-utils';

interface DocumentBinding {
	readonly document: ISavableEditorDocument;
	readonly statusUnsubscribe: Unsubscriber;
	currentStatus: DraftStatus;
}

export class ConflictResolutionService implements IConflictResolutionService {
	public readonly items: Readable<ReadonlyArray<ConflictItem>>;

	private readonly itemsStore: Writable<ReadonlyArray<ConflictItem>>;
	private readonly bindings: Map<NodeID, DocumentBinding>;
	private readonly documentsUnsubscribe: Unsubscriber;

	private disposed: boolean;

	public constructor(documentRegistry: IObservableEditorDocumentRegistry) {
		this.bindings = new Map<NodeID, DocumentBinding>();
		this.itemsStore = writable<ReadonlyArray<ConflictItem>>([]);
		this.items = this.itemsStore;
		this.disposed = false;

		this.documentsUnsubscribe = documentRegistry.documents.subscribe(
			(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void => {
				this.reconcileBindings(documents);
			}
		);
	}

	public dispose(): void {
		this.disposed = true;
		this.documentsUnsubscribe();
		for (const binding of this.bindings.values()) {
			binding.statusUnsubscribe();
		}
		this.bindings.clear();
		this.itemsStore.set([]);
	}

	public getItem(nodeID: NodeID): ConflictItem | null {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return null;
		}
		const item: ConflictItem | null = this.deriveItem(nodeID, binding.currentStatus);
		return item;
	}

	public async overwrite(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, OverwriteConflictError>> {
		if (this.disposed) {
			return failure(this.buildOverwriteError(OverwriteConflictErrorKind.DISPOSED));
		}
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return failure(this.buildOverwriteError(OverwriteConflictErrorKind.NOT_FOUND));
		}
		if (binding.currentStatus.kind !== DraftStatusKind.CONFLICTED) {
			return failure(this.buildOverwriteError(OverwriteConflictErrorKind.NOT_CONFLICTED));
		}
		if (binding.currentStatus.revision.value !== revision.value) {
			return failure(this.buildOverwriteError(OverwriteConflictErrorKind.STALE_REVISION));
		}

		const result: Result<void, DocumentForceWriteError> = await binding.document.forceWrite();
		if (result.ok) {
			return success(undefined);
		}
		const mappedKind: OverwriteConflictErrorKind = this.mapForceWriteErrorKind(result.error.kind);
		return failure(this.buildOverwriteError(mappedKind));
	}

	public async reload(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, ReloadConflictError>> {
		if (this.disposed) {
			return failure(this.buildReloadError(ReloadConflictErrorKind.DISPOSED));
		}
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return failure(this.buildReloadError(ReloadConflictErrorKind.NOT_FOUND));
		}
		if (binding.currentStatus.kind !== DraftStatusKind.CONFLICTED) {
			return failure(this.buildReloadError(ReloadConflictErrorKind.NOT_CONFLICTED));
		}
		if (binding.currentStatus.revision.value !== revision.value) {
			return failure(this.buildReloadError(ReloadConflictErrorKind.STALE_REVISION));
		}

		const result: Result<void, DocumentRevertError> = await binding.document.revert();
		if (result.ok) {
			return success(undefined);
		}
		const mappedKind: ReloadConflictErrorKind = this.mapRevertErrorKind(result.error.kind);
		return failure(this.buildReloadError(mappedKind));
	}

	private reconcileBindings(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void {
		const removedNodeIDs: NodeID[] = [];
		for (const nodeID of this.bindings.keys()) {
			if (!documents.has(nodeID)) {
				removedNodeIDs.push(nodeID);
			}
		}
		for (const nodeID of removedNodeIDs) {
			this.tearDownBinding(nodeID);
		}

		for (const [nodeID, document] of documents) {
			if (this.bindings.has(nodeID)) {
				continue;
			}
			this.bindToDocument(nodeID, document);
		}

		this.refreshItems();
	}

	private bindToDocument(nodeID: NodeID, document: ISavableEditorDocument): void {
		const initialStatus: DraftStatus = get(document.draftStatus);
		const statusUnsubscribe: Unsubscriber = document.draftStatus.subscribe(
			(status: DraftStatus): void => {
				this.handleStatusChange(nodeID, status);
			}
		);
		const binding: DocumentBinding = {
			document: document,
			statusUnsubscribe: statusUnsubscribe,
			currentStatus: initialStatus
		};
		this.bindings.set(nodeID, binding);
	}

	private tearDownBinding(nodeID: NodeID): void {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return;
		}
		binding.statusUnsubscribe();
		this.bindings.delete(nodeID);
	}

	private handleStatusChange(nodeID: NodeID, status: DraftStatus): void {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return;
		}
		binding.currentStatus = status;
		this.refreshItems();
	}

	private refreshItems(): void {
		const next: ConflictItem[] = [];
		for (const [nodeID, binding] of this.bindings) {
			const item: ConflictItem | null = this.deriveItem(nodeID, binding.currentStatus);
			if (item !== null) {
				next.push(item);
			}
		}
		this.itemsStore.set(next);
	}

	private deriveItem(nodeID: NodeID, status: DraftStatus): ConflictItem | null {
		if (status.kind !== DraftStatusKind.CONFLICTED) {
			return null;
		}
		const item: ConflictItem = {
			nodeID: nodeID,
			revision: status.revision
		};
		return item;
	}

	private mapForceWriteErrorKind(
		kind: DocumentForceWriteErrorKind
	): OverwriteConflictErrorKind {
		switch (kind) {
			case DocumentForceWriteErrorKind.NOT_CONFLICTED:
				return OverwriteConflictErrorKind.NOT_CONFLICTED;
			case DocumentForceWriteErrorKind.INVALID:
				return OverwriteConflictErrorKind.INVALID;
			case DocumentForceWriteErrorKind.READ_ONLY:
				return OverwriteConflictErrorKind.READ_ONLY;
			case DocumentForceWriteErrorKind.CONFLICTED:
				return OverwriteConflictErrorKind.STALE_REVISION;
			case DocumentForceWriteErrorKind.PORT_WRITE_FAILED:
				return OverwriteConflictErrorKind.PORT_WRITE_FAILED;
			case DocumentForceWriteErrorKind.DISPOSED:
				return OverwriteConflictErrorKind.DISPOSED;
		}
	}

	private mapRevertErrorKind(kind: DocumentRevertErrorKind): ReloadConflictErrorKind {
		switch (kind) {
			case DocumentRevertErrorKind.INVALID:
				return ReloadConflictErrorKind.INVALID;
			case DocumentRevertErrorKind.PORT_READ_FAILED:
				return ReloadConflictErrorKind.PORT_READ_FAILED;
			case DocumentRevertErrorKind.DISPOSED:
				return ReloadConflictErrorKind.DISPOSED;
		}
	}

	private buildOverwriteError(kind: OverwriteConflictErrorKind): OverwriteConflictError {
		return {
			kind: kind,
			message: OverwriteConflictErrorMessages[kind]
		};
	}

	private buildReloadError(kind: ReloadConflictErrorKind): ReloadConflictError {
		return {
			kind: kind,
			message: ReloadConflictErrorMessages[kind]
		};
	}
}
