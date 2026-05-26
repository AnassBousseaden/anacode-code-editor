import type {
	EditorDocumentOpenError,
	EditorDocumentReloadError
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';

export type DocumentFailureError = EditorDocumentOpenError | EditorDocumentReloadError;

export enum DocumentStateKind {
	NONE = 'NONE',
	LOADING = 'LOADING',
	LOADED = 'LOADED',
	FAILED = 'FAILED'
}

export interface NoneDocumentState {
	readonly kind: DocumentStateKind.NONE;
}

export interface LoadingDocumentState {
	readonly kind: DocumentStateKind.LOADING;
	readonly nodeID: NodeID;
}

export interface LoadedDocumentState {
	readonly kind: DocumentStateKind.LOADED;
	readonly nodeID: NodeID;
}

export interface FailedDocumentState {
	readonly kind: DocumentStateKind.FAILED;
	readonly nodeID: NodeID;
	readonly error: DocumentFailureError;
}

export type DocumentState =
	| NoneDocumentState
	| LoadingDocumentState
	| LoadedDocumentState
	| FailedDocumentState;

export const NONE_DOCUMENT_STATE: NoneDocumentState = {
	kind: DocumentStateKind.NONE
};

export enum OpenIntentErrorKind {
	DOCUMENT_OPEN_FAILED = 'DOCUMENT_OPEN_FAILED',
	SUPERSEDED = 'SUPERSEDED'
}

export interface DocumentOpenFailedError {
	readonly kind: OpenIntentErrorKind.DOCUMENT_OPEN_FAILED;
	readonly cause: EditorDocumentOpenError;
}

export interface SupersededError {
	readonly kind: OpenIntentErrorKind.SUPERSEDED;
}

export type OpenIntentError = DocumentOpenFailedError | SupersededError;

export const SUPERSEDED_ERROR: SupersededError = {
	kind: OpenIntentErrorKind.SUPERSEDED
};
