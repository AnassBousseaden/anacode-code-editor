import type { Readable } from 'svelte/store';

import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type { InvalidEntryReason } from '$lib/core/editor/save/registry/draft-registry';
import type {
	NodeID,
	NodeOperationFailure
} from '$lib/core/file-system/domain/file-system-models';
import type { IWaitable } from '$lib/core/shared/lifecycle/editor-lifecycle-waitable';
import type {
	IDisposable1,
	ITransactionEventSource,
	Result
} from '$lib/core/shared/models-utils';

export enum EditorDocumentServiceErrorKind {
	TARGET_UNAVAILABLE = 'TARGET_UNAVAILABLE',
	DOCUMENT_CREATION_FAILED = 'DOCUMENT_CREATION_FAILED',
	NOT_LOADED = 'NOT_LOADED'
}

export interface EditorDocumentTargetUnavailableError
	extends NodeOperationFailure<EditorDocumentServiceErrorKind.TARGET_UNAVAILABLE> {
	readonly reason: InvalidEntryReason;
}

export type EditorDocumentCreationFailedError =
	NodeOperationFailure<EditorDocumentServiceErrorKind.DOCUMENT_CREATION_FAILED>;

export type EditorDocumentNotLoadedError =
	NodeOperationFailure<EditorDocumentServiceErrorKind.NOT_LOADED>;

export type EditorDocumentOpenError =
	| EditorDocumentTargetUnavailableError
	| EditorDocumentCreationFailedError;

export type EditorDocumentReloadError = EditorDocumentNotLoadedError | EditorDocumentOpenError;

export type EditorDocumentEvictError = NodeOperationFailure<never>;

export enum EditorDocumentLifecycleEventType {
	DOCUMENT_DID_OPEN = 'DOCUMENT_DID_OPEN',
	DOCUMENT_WILL_RELOAD = 'DOCUMENT_WILL_RELOAD',
	DOCUMENT_DID_RELOAD = 'DOCUMENT_DID_RELOAD',
	DOCUMENT_DID_FAIL_RELOAD = 'DOCUMENT_DID_FAIL_RELOAD',
	DOCUMENT_WILL_EVICT = 'DOCUMENT_WILL_EVICT',
	DOCUMENT_DID_EVICT = 'DOCUMENT_DID_EVICT'
}

export interface EditorDocumentDidOpenEvent {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_DID_OPEN;
	readonly nodeID: NodeID;
	readonly document: ISavableEditorDocument;
}

export interface EditorDocumentWillReloadEvent extends IWaitable {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_WILL_RELOAD;
	readonly nodeID: NodeID;
}

export interface EditorDocumentDidReloadEvent {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_DID_RELOAD;
	readonly nodeID: NodeID;
	readonly document: ISavableEditorDocument;
}

export interface EditorDocumentDidFailReloadEvent {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_DID_FAIL_RELOAD;
	readonly nodeID: NodeID;
	readonly error: EditorDocumentReloadError;
}

export interface EditorDocumentWillEvictEvent extends IWaitable {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_WILL_EVICT;
	readonly nodeID: NodeID;
}

export interface EditorDocumentDidEvictEvent {
	readonly type: EditorDocumentLifecycleEventType.DOCUMENT_DID_EVICT;
	readonly nodeID: NodeID;
}

export type EditorDocumentLifecycleEvent =
	| EditorDocumentDidOpenEvent
	| EditorDocumentWillReloadEvent
	| EditorDocumentDidReloadEvent
	| EditorDocumentDidFailReloadEvent
	| EditorDocumentWillEvictEvent
	| EditorDocumentDidEvictEvent;

export interface EditorDocumentServiceState {
	readonly loadedDocumentCount: number;
}

export interface IEditorDocumentService
	extends IDisposable1, ITransactionEventSource<EditorDocumentLifecycleEvent> {
	readonly state: Readable<EditorDocumentServiceState>;

	open(nodeID: NodeID): Promise<Result<IEditorDocument, EditorDocumentOpenError>>;

	reload(nodeID: NodeID): Promise<Result<IEditorDocument, EditorDocumentReloadError>>;

	evict(nodeID: NodeID): Promise<Result<boolean, EditorDocumentEvictError>>;

	getLoaded(nodeID: NodeID): ISavableEditorDocument | null;
}
