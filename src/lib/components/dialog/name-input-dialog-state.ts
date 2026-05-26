import type { FileTreeActionError } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

export enum NameInputDialogStateKind {
	EDITING = 'editing',
	EDITING_INVALID = 'editing-invalid',
	SUBMITTING = 'submitting',
	SUBMIT_FAILED = 'submit-failed'
}

export interface EditingNameInputDialogState {
	readonly kind: NameInputDialogStateKind.EDITING;
	readonly name: string;
}

export interface EditingInvalidNameInputDialogState {
	readonly kind: NameInputDialogStateKind.EDITING_INVALID;
	readonly name: string;
	readonly validationError: FileTreeActionError;
}

export interface SubmittingNameInputDialogState {
	readonly kind: NameInputDialogStateKind.SUBMITTING;
	readonly name: string;
}

export interface SubmitFailedNameInputDialogState {
	readonly kind: NameInputDialogStateKind.SUBMIT_FAILED;
	readonly name: string;
	readonly submitError: FileTreeActionError;
}

export type NameInputDialogState =
	| EditingNameInputDialogState
	| EditingInvalidNameInputDialogState
	| SubmittingNameInputDialogState
	| SubmitFailedNameInputDialogState;
