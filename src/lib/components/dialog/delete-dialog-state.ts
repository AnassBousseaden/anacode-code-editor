import type { FileTreeActionError } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

export enum DeleteDialogStateKind {
	CONFIRMING = 'confirming',
	SUBMITTING = 'submitting',
	SUBMIT_FAILED = 'submit-failed'
}

export interface ConfirmingDeleteDialogState {
	readonly kind: DeleteDialogStateKind.CONFIRMING;
}

export interface SubmittingDeleteDialogState {
	readonly kind: DeleteDialogStateKind.SUBMITTING;
}

export interface SubmitFailedDeleteDialogState {
	readonly kind: DeleteDialogStateKind.SUBMIT_FAILED;
	readonly submitError: FileTreeActionError;
}

export type DeleteDialogState =
	| ConfirmingDeleteDialogState
	| SubmittingDeleteDialogState
	| SubmitFailedDeleteDialogState;
