export enum ConflictPromptActionKind {
	OVERWRITE = 'OVERWRITE',
	RELOAD = 'RELOAD',
	RETRY = 'RETRY'
}

export interface OverwriteConflictPromptAction {
	readonly kind: ConflictPromptActionKind.OVERWRITE;
}

export interface ReloadConflictPromptAction {
	readonly kind: ConflictPromptActionKind.RELOAD;
}

export interface RetryConflictPromptAction {
	readonly kind: ConflictPromptActionKind.RETRY;
}

export type ConflictPromptAction =
	| OverwriteConflictPromptAction
	| ReloadConflictPromptAction
	| RetryConflictPromptAction;

export enum InvalidDocumentActionKind {
	CLOSE = 'CLOSE',
	RETRY_CLOSE = 'RETRY_CLOSE'
}

export interface CloseInvalidDocumentAction {
	readonly kind: InvalidDocumentActionKind.CLOSE;
}

export interface RetryCloseInvalidDocumentAction {
	readonly kind: InvalidDocumentActionKind.RETRY_CLOSE;
}

export type InvalidDocumentAction =
	| CloseInvalidDocumentAction
	| RetryCloseInvalidDocumentAction;

export enum GenericPromptActionKind {
	HIDE = 'HIDE',
	DISMISS = 'DISMISS'
}

export interface HidePromptAction {
	readonly kind: GenericPromptActionKind.HIDE;
}

export interface DismissPromptAction {
	readonly kind: GenericPromptActionKind.DISMISS;
}

export type GenericPromptAction = HidePromptAction | DismissPromptAction;

export type EditorPromptAction =
	| ConflictPromptAction
	| InvalidDocumentAction
	| GenericPromptAction;
