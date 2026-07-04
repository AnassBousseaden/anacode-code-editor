import type { EditorMessageKey } from '$lib/core/localization/localization-models';
import {
	OverwriteConflictErrorKind,
	ReloadConflictErrorKind
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import { CloseInvalidDocumentErrorKind } from '$lib/core/editor/invalid-document/invalid-document-service';
import { CloseIntentErrorKind } from '$lib/core/editor/intent/editor-intent-models';

/**
 * Prompt copy tables map a domain error kind to a localized message *key*, not
 * a rendered string. The presentation edge (prompt view components for the
 * conflict/invalid stacks, the prompt manager for the close-intent notification)
 * resolves the key against the session's `EditorMessages`. Only the key type is
 * imported here — no runtime localization dependency in the domain.
 */
export const OverwriteConflictPromptMessages: Readonly<
	Record<OverwriteConflictErrorKind, EditorMessageKey>
> = {
	[OverwriteConflictErrorKind.NOT_FOUND]: 'prompt.conflict.notFound',
	[OverwriteConflictErrorKind.STALE_REVISION]: 'prompt.conflict.staleRevision',
	[OverwriteConflictErrorKind.NOT_CONFLICTED]: 'prompt.conflict.notConflicted',
	[OverwriteConflictErrorKind.INVALID]: 'prompt.conflict.invalid',
	[OverwriteConflictErrorKind.READ_ONLY]: 'prompt.conflict.readOnly',
	[OverwriteConflictErrorKind.PORT_WRITE_FAILED]: 'prompt.conflict.writeFailed',
	[OverwriteConflictErrorKind.DISPOSED]: 'prompt.conflict.disposed'
};

export const ReloadConflictPromptMessages: Readonly<
	Record<ReloadConflictErrorKind, EditorMessageKey>
> = {
	[ReloadConflictErrorKind.NOT_FOUND]: 'prompt.conflict.notFound',
	[ReloadConflictErrorKind.STALE_REVISION]: 'prompt.conflict.staleRevision',
	[ReloadConflictErrorKind.NOT_CONFLICTED]: 'prompt.conflict.notConflicted',
	[ReloadConflictErrorKind.PORT_READ_FAILED]: 'prompt.conflict.readFailed',
	[ReloadConflictErrorKind.INVALID]: 'prompt.conflict.invalid',
	[ReloadConflictErrorKind.DISPOSED]: 'prompt.conflict.disposed'
};

export const CloseInvalidDocumentPromptMessages: Readonly<
	Record<CloseInvalidDocumentErrorKind, EditorMessageKey>
> = {
	[CloseInvalidDocumentErrorKind.NOT_FOUND]: 'prompt.conflict.notFound',
	[CloseInvalidDocumentErrorKind.STALE_REVISION]: 'prompt.invalidDoc.staleRevision',
	[CloseInvalidDocumentErrorKind.NOT_INVALID]: 'prompt.invalidDoc.notInvalid',
	[CloseInvalidDocumentErrorKind.EVICT_FAILED]: 'prompt.invalidDoc.closeFailed',
	[CloseInvalidDocumentErrorKind.DISPOSED]: 'prompt.invalidDoc.disposed'
};

export interface IntentCloseFailurePromptCopy {
	readonly title: EditorMessageKey;
	readonly content: EditorMessageKey;
}

export const IntentCloseFailurePromptMessages: Readonly<
	Record<CloseIntentErrorKind, IntentCloseFailurePromptCopy>
> = {
	[CloseIntentErrorKind.UNSAVED_DRAFT]: {
		title: 'prompt.closeFailure.unsavedDraft.title',
		content: 'prompt.closeFailure.unsavedDraft.content'
	}
};
