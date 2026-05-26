import type {
	NodeID,
	NodeOperationFailure
} from '$lib/core/file-system/domain/file-system-models';

export enum CloseIntentErrorKind {
	UNSAVED_DRAFT = 'UNSAVED_DRAFT'
}

export type CloseUnsavedDraftError = NodeOperationFailure<CloseIntentErrorKind.UNSAVED_DRAFT>;

export type CloseIntentError = CloseUnsavedDraftError;

export interface CloseAllIntentError {
	readonly failedClosures: ReadonlyMap<NodeID, CloseIntentError>;
}

export enum SaveIntentErrorKind {
	NOT_LOADED = 'NOT_LOADED',
	SAVE_FAILED = 'SAVE_FAILED'
}

export type SaveNotLoadedError = NodeOperationFailure<SaveIntentErrorKind.NOT_LOADED>;

export type SaveFailedError = NodeOperationFailure<SaveIntentErrorKind.SAVE_FAILED>;

export type SaveIntentError = SaveNotLoadedError | SaveFailedError;

export interface SaveAllIntentError {
	readonly failedSaves: ReadonlyMap<NodeID, SaveIntentError>;
}
