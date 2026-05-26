import {
	OverwriteConflictErrorKind,
	ReloadConflictErrorKind
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import { CloseInvalidDocumentErrorKind } from '$lib/core/editor/invalid-document/invalid-document-service';
import { CloseIntentErrorKind } from '$lib/core/editor/intent/editor-intent-models';

export const OverwriteConflictPromptMessages: Readonly<
	Record<OverwriteConflictErrorKind, string>
> = {
	[OverwriteConflictErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[OverwriteConflictErrorKind.STALE_REVISION]: 'File changed again on disk — try again.',
	[OverwriteConflictErrorKind.NOT_CONFLICTED]: 'File is no longer conflicted.',
	[OverwriteConflictErrorKind.INVALID]: 'File no longer exists on disk.',
	[OverwriteConflictErrorKind.READ_ONLY]: 'File is read-only.',
	[OverwriteConflictErrorKind.PORT_WRITE_FAILED]: 'Could not write to disk.',
	[OverwriteConflictErrorKind.DISPOSED]: 'Document was closed.'
};

export const ReloadConflictPromptMessages: Readonly<Record<ReloadConflictErrorKind, string>> = {
	[ReloadConflictErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[ReloadConflictErrorKind.STALE_REVISION]: 'File changed again on disk — try again.',
	[ReloadConflictErrorKind.NOT_CONFLICTED]: 'File is no longer conflicted.',
	[ReloadConflictErrorKind.PORT_READ_FAILED]: 'Could not read from disk.',
	[ReloadConflictErrorKind.INVALID]: 'File no longer exists on disk.',
	[ReloadConflictErrorKind.DISPOSED]: 'Document was closed.'
};

export const CloseInvalidDocumentPromptMessages: Readonly<
	Record<CloseInvalidDocumentErrorKind, string>
> = {
	[CloseInvalidDocumentErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[CloseInvalidDocumentErrorKind.STALE_REVISION]: 'Document state changed — try again.',
	[CloseInvalidDocumentErrorKind.NOT_INVALID]: 'Document is no longer invalid.',
	[CloseInvalidDocumentErrorKind.EVICT_FAILED]: 'Could not close the document.',
	[CloseInvalidDocumentErrorKind.DISPOSED]: 'Editor was closed.'
};

export interface IntentCloseFailurePromptCopy {
	readonly title: string;
	readonly content: string;
}

export const IntentCloseFailurePromptMessages: Readonly<
	Record<CloseIntentErrorKind, IntentCloseFailurePromptCopy>
> = {
	[CloseIntentErrorKind.UNSAVED_DRAFT]: {
		title: 'Unsaved changes',
		content: 'Save or discard before closing.'
	}
};
