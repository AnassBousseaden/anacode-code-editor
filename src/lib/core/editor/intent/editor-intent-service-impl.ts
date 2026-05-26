import { get, type Readable, type Unsubscriber, type Writable, writable } from 'svelte/store';

import {
	type DocumentFailureError,
	type DocumentOpenFailedError,
	type DocumentState,
	DocumentStateKind,
	type FailedDocumentState,
	type LoadedDocumentState,
	type LoadingDocumentState,
	NONE_DOCUMENT_STATE,
	type OpenIntentError,
	OpenIntentErrorKind,
	SUPERSEDED_ERROR
} from '$lib/core/code-editor/editor-orchestration-models';
import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import type {
	DocumentSaveError,
	DraftStatus,
	ISavableEditorDocument
} from '$lib/core/editor/document/savable-editor-document';
import { DraftStatusKind } from '$lib/core/editor/document/savable-editor-document';
import type {
	EditorDocumentDidEvictEvent,
	EditorDocumentDidFailReloadEvent,
	EditorDocumentLifecycleEvent,
	EditorDocumentOpenError,
	IEditorDocumentService
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import { EditorDocumentLifecycleEventType } from '$lib/core/editor/document-lifecycle/editor-document-service';
import type {
	CloseAllIntentError,
	CloseIntentError,
	SaveAllIntentError,
	SaveIntentError
} from '$lib/core/editor/intent/editor-intent-models';
import {
	CloseIntentErrorKind,
	SaveIntentErrorKind
} from '$lib/core/editor/intent/editor-intent-models';
import type {
	EditorIntentEvent,
	IEditorIntentService
} from '$lib/core/editor/intent/editor-intent-service';
import { EditorIntentEventType } from '$lib/core/editor/intent/editor-intent-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';
import { failure, type Result, success, type TransactionListener } from '$lib/core/shared/models-utils';

const LOG_SCOPE: string = 'editor-intent-service';

const ErrorMessages = {
	UNSAVED_DRAFT: (nodeID: NodeID): string => `Cannot close node ${nodeID}: unsaved changes.`,
	NOT_LOADED: (nodeID: NodeID): string => `Cannot save node ${nodeID}: document is not loaded.`,
	SAVE_FAILED: (nodeID: NodeID, cause: string): string => `Failed to save node ${nodeID}: ${cause}`
} as const;

export class EditorIntentService implements IEditorIntentService {
	public readonly activeDocument: Readable<DocumentState>;
	public readonly openDocumentIDs: Readable<ReadonlyArray<NodeID>>;

	private readonly editorDocumentService: IEditorDocumentService;
	private readonly logger: IEditorLogger;
	private readonly activeDocumentStore: Writable<DocumentState>;
	private readonly openDocumentIDsStore: Writable<ReadonlyArray<NodeID>>;
	private readonly documentLifecycleUnsubscribe: Unsubscriber;
	private readonly listeners: Set<TransactionListener<EditorIntentEvent>>;

	private currentState: DocumentState;
	private currentOpenList: ReadonlyArray<NodeID>;
	private nextActivationToken: number;

	public constructor(editorDocumentService: IEditorDocumentService, logger: IEditorLogger) {
		this.editorDocumentService = editorDocumentService;
		this.logger = logger;

		this.currentState = NONE_DOCUMENT_STATE;
		this.currentOpenList = [];
		this.nextActivationToken = 0;

		this.activeDocumentStore = writable<DocumentState>(NONE_DOCUMENT_STATE);
		this.openDocumentIDsStore = writable<ReadonlyArray<NodeID>>([]);
		this.activeDocument = this.activeDocumentStore;
		this.openDocumentIDs = this.openDocumentIDsStore;

		this.listeners = new Set<TransactionListener<EditorIntentEvent>>();

		this.documentLifecycleUnsubscribe = this.editorDocumentService.onTransaction(
			(event: EditorDocumentLifecycleEvent): void => {
				this.handleDocumentLifecycleEvent(event);
			}
		);
	}

	public dispose(): void {
		this.documentLifecycleUnsubscribe();
		this.listeners.clear();
	}

	public onTransaction(listener: TransactionListener<EditorIntentEvent>): Unsubscriber {
		this.listeners.add(listener);
		return (): void => {
			this.listeners.delete(listener);
		};
	}

	public async open(nodeID: NodeID): Promise<Result<void, OpenIntentError>> {
		return this.runOpenIntent(nodeID, true);
	}

	public async openPreserveFocus(nodeID: NodeID): Promise<Result<void, OpenIntentError>> {
		return this.runOpenIntent(nodeID, false);
	}

	public async close(nodeID: NodeID): Promise<Result<void, CloseIntentError>> {
		const indexBeforeRemoval: number = this.currentOpenList.indexOf(nodeID);
		if (indexBeforeRemoval === -1) {
			return success(undefined);
		}

		const blockError: CloseIntentError | null = this.evaluateCloseBlock(nodeID);
		if (blockError !== null) {
			this.emitDidFailClose(nodeID, blockError);
			return failure(blockError);
		}

		const wasActive: boolean = this.isActiveNode(nodeID);
		let pickedNeighbor: NodeID | null;
		if (wasActive) {
			pickedNeighbor = this.pickNextActiveFromIndex(indexBeforeRemoval);
		} else {
			pickedNeighbor = null;
		}

		this.removeFromOpenList(nodeID);

		await this.editorDocumentService.evict(nodeID);

		if (wasActive && pickedNeighbor !== null) {
			await this.runOpenIntent(pickedNeighbor, false);
		}

		return success(undefined);
	}

	public async closeActive(): Promise<Result<void, CloseIntentError>> {
		if (this.currentState.kind === DocumentStateKind.NONE) {
			return success(undefined);
		}

		return this.close(this.currentState.nodeID);
	}

	public async closeAll(): Promise<Result<void, CloseAllIntentError>> {
		const snapshot: ReadonlyArray<NodeID> = this.currentOpenList.slice();
		const failedClosures: Map<NodeID, CloseIntentError> = new Map<NodeID, CloseIntentError>();

		for (const nodeID of snapshot) {
			const result: Result<void, CloseIntentError> = await this.close(nodeID);
			if (!result.ok) {
				failedClosures.set(nodeID, result.error);
			}
		}

		if (failedClosures.size > 0) {
			const error: CloseAllIntentError = { failedClosures: failedClosures };
			return failure(error);
		}

		return success(undefined);
	}

	public async save(nodeID: NodeID): Promise<Result<void, SaveIntentError>> {
		const document: ISavableEditorDocument | null = this.editorDocumentService.getLoaded(nodeID);

		if (document === null) {
			const notLoadedError: SaveIntentError = {
				kind: SaveIntentErrorKind.NOT_LOADED,
				message: ErrorMessages.NOT_LOADED(nodeID),
				nodeID: nodeID
			};
			return failure(notLoadedError);
		}

		const saveResult: Result<void, DocumentSaveError> = await document.save();
		if (!saveResult.ok) {
			const saveFailedError: SaveIntentError = {
				kind: SaveIntentErrorKind.SAVE_FAILED,
				message: ErrorMessages.SAVE_FAILED(nodeID, saveResult.error.message),
				nodeID: nodeID
			};
			return failure(saveFailedError);
		}

		return success(undefined);
	}

	public async saveAll(): Promise<Result<void, SaveAllIntentError>> {
		const snapshot: ReadonlyArray<NodeID> = this.currentOpenList.slice();
		const failedSaves: Map<NodeID, SaveIntentError> = new Map<NodeID, SaveIntentError>();

		for (const nodeID of snapshot) {
			const document: ISavableEditorDocument | null = this.editorDocumentService.getLoaded(nodeID);
			if (document === null) {
				continue;
			}
			const status: DraftStatus = get(document.draftStatus);
			if (status.kind !== DraftStatusKind.SAVEABLE) {
				continue;
			}
			const result: Result<void, SaveIntentError> = await this.save(nodeID);
			if (!result.ok) {
				failedSaves.set(nodeID, result.error);
			}
		}

		if (failedSaves.size > 0) {
			const error: SaveAllIntentError = { failedSaves: failedSaves };
			return failure(error);
		}

		return success(undefined);
	}

	private async runOpenIntent(
		nodeID: NodeID,
		focusOnReady: boolean
	): Promise<Result<void, OpenIntentError>> {
		const cachedDocument: ISavableEditorDocument | null =
			this.editorDocumentService.getLoaded(nodeID);

		if (cachedDocument !== null) {
			this.addToOpenList(nodeID);
			if (!this.isActiveNode(nodeID)) {
				this.transitionToLoaded(nodeID);
			}
			this.emitDidOpen(nodeID, focusOnReady);
			return success(undefined);
		}

		const myToken: number = this.acquireActivationToken();

		this.addToOpenList(nodeID);
		this.transitionToLoading(nodeID);

		const openResult: Result<IEditorDocument, EditorDocumentOpenError> =
			await this.editorDocumentService.open(nodeID);

		if (this.isSuperseded(myToken)) {
			return failure(SUPERSEDED_ERROR);
		}

		if (!openResult.ok) {
			this.transitionToFailed(nodeID, openResult.error);
			const failureError: DocumentOpenFailedError = {
				kind: OpenIntentErrorKind.DOCUMENT_OPEN_FAILED,
				cause: openResult.error
			};
			return failure(failureError);
		}

		this.transitionToLoaded(nodeID);
		this.emitDidOpen(nodeID, focusOnReady);
		return success(undefined);
	}

	private emitDidOpen(nodeID: NodeID, focusOnReady: boolean): void {
		const event: EditorIntentEvent = {
			type: EditorIntentEventType.INTENT_DID_OPEN,
			nodeID: nodeID,
			focusOnReady: focusOnReady
		};
		this.dispatch(event);
	}

	private emitDidFailClose(nodeID: NodeID, error: CloseIntentError): void {
		const event: EditorIntentEvent = {
			type: EditorIntentEventType.INTENT_DID_FAIL_CLOSE,
			nodeID: nodeID,
			error: error
		};
		this.dispatch(event);
	}

	private dispatch(event: EditorIntentEvent): void {
		for (const listener of this.listeners) {
			try {
				listener(event);
			} catch (error: unknown) {
				const message: string = error instanceof Error ? error.message : String(error);
				this.logger.log({
					scope: LOG_SCOPE,
					event: 'listener.threw',
					level: EditorLogLevel.WARN,
					data: {
						eventType: event.type,
						message: message
					}
				});
			}
		}
	}

	private evaluateCloseBlock(nodeID: NodeID): CloseIntentError | null {
		const document: ISavableEditorDocument | null = this.editorDocumentService.getLoaded(nodeID);
		if (document === null) {
			return null;
		}

		const status: DraftStatus = get(document.draftStatus);
		if (status.kind === DraftStatusKind.SAVEABLE || status.kind === DraftStatusKind.CONFLICTED) {
			return {
				kind: CloseIntentErrorKind.UNSAVED_DRAFT,
				message: ErrorMessages.UNSAVED_DRAFT(nodeID),
				nodeID: nodeID
			};
		}

		return null;
	}

	private handleDocumentLifecycleEvent(event: EditorDocumentLifecycleEvent): void {
		switch (event.type) {
			case EditorDocumentLifecycleEventType.DOCUMENT_DID_OPEN:
				return;

			case EditorDocumentLifecycleEventType.DOCUMENT_WILL_RELOAD:
				return;

			case EditorDocumentLifecycleEventType.DOCUMENT_DID_RELOAD:
				return;

			case EditorDocumentLifecycleEventType.DOCUMENT_DID_FAIL_RELOAD:
				this.handleDidFailReload(event);
				return;

			case EditorDocumentLifecycleEventType.DOCUMENT_WILL_EVICT:
				return;

			case EditorDocumentLifecycleEventType.DOCUMENT_DID_EVICT:
				this.handleDidEvict(event);
				return;
		}
	}

	private handleDidFailReload(event: EditorDocumentDidFailReloadEvent): void {
		if (!this.isActiveNode(event.nodeID)) {
			return;
		}
		this.transitionToFailed(event.nodeID, event.error);
	}

	private handleDidEvict(event: EditorDocumentDidEvictEvent): void {
		if (!this.isActiveNode(event.nodeID)) {
			return;
		}
		this.setState(NONE_DOCUMENT_STATE);
	}

	private acquireActivationToken(): number {
		const nextToken: number = this.nextActivationToken + 1;
		this.nextActivationToken = nextToken;
		return nextToken;
	}

	private isSuperseded(myToken: number): boolean {
		return this.nextActivationToken !== myToken;
	}

	private isActiveNode(nodeID: NodeID): boolean {
		if (this.currentState.kind === DocumentStateKind.NONE) {
			return false;
		}
		return this.currentState.nodeID === nodeID;
	}

	private pickNextActiveFromIndex(closedIndex: number): NodeID | null {
		const list: ReadonlyArray<NodeID> = this.currentOpenList;
		const remainingCount: number = list.length - 1;

		if (remainingCount === 0) {
			return null;
		}

		if (closedIndex < remainingCount) {
			return list[closedIndex + 1];
		}

		return list[closedIndex - 1];
	}

	private addToOpenList(nodeID: NodeID): void {
		if (this.currentOpenList.includes(nodeID)) {
			return;
		}
		const newList: NodeID[] = this.currentOpenList.concat(nodeID);
		this.setOpenList(newList);
	}

	private removeFromOpenList(nodeID: NodeID): void {
		const newList: NodeID[] = this.currentOpenList.filter((id: NodeID): boolean => {
			return id !== nodeID;
		});
		this.setOpenList(newList);
	}

	private setOpenList(list: ReadonlyArray<NodeID>): void {
		this.currentOpenList = list;
		this.openDocumentIDsStore.set(list);
	}

	private transitionToLoading(nodeID: NodeID): void {
		const loadingState: LoadingDocumentState = {
			kind: DocumentStateKind.LOADING,
			nodeID: nodeID
		};
		this.setState(loadingState);
	}

	private transitionToLoaded(nodeID: NodeID): void {
		const loadedState: LoadedDocumentState = {
			kind: DocumentStateKind.LOADED,
			nodeID: nodeID
		};
		this.setState(loadedState);
	}

	private transitionToFailed(nodeID: NodeID, error: DocumentFailureError): void {
		const failedState: FailedDocumentState = {
			kind: DocumentStateKind.FAILED,
			nodeID: nodeID,
			error: error
		};
		this.setState(failedState);
	}

	private setState(state: DocumentState): void {
		this.currentState = state;
		this.activeDocumentStore.set(state);
	}
}
