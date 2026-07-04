import type {EditorMessages} from '$lib/core/localization/localization-models';
import {
	OverwriteConflictErrorKind,
	ReloadConflictErrorKind
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import {CloseInvalidDocumentErrorKind} from '$lib/core/editor/invalid-document/invalid-document-service';
import {CloseIntentErrorKind} from '$lib/core/editor/intent/editor-intent-models';

export function resolveOverwriteConflictFailureMessage(
	messages: EditorMessages,
	kind: OverwriteConflictErrorKind
): string {
	switch (kind) {
		case OverwriteConflictErrorKind.NOT_FOUND:
			return messages.promptConflictNotFound;
		case OverwriteConflictErrorKind.STALE_REVISION:
			return messages.promptConflictStaleRevision;
		case OverwriteConflictErrorKind.NOT_CONFLICTED:
			return messages.promptConflictNotConflicted;
		case OverwriteConflictErrorKind.INVALID:
			return messages.promptConflictInvalid;
		case OverwriteConflictErrorKind.READ_ONLY:
			return messages.promptConflictReadOnly;
		case OverwriteConflictErrorKind.PORT_WRITE_FAILED:
			return messages.promptConflictWriteFailed;
		case OverwriteConflictErrorKind.DISPOSED:
			return messages.promptConflictDisposed;
	}
}

export function resolveReloadConflictFailureMessage(
	messages: EditorMessages,
	kind: ReloadConflictErrorKind
): string {
	switch (kind) {
		case ReloadConflictErrorKind.NOT_FOUND:
			return messages.promptConflictNotFound;
		case ReloadConflictErrorKind.STALE_REVISION:
			return messages.promptConflictStaleRevision;
		case ReloadConflictErrorKind.NOT_CONFLICTED:
			return messages.promptConflictNotConflicted;
		case ReloadConflictErrorKind.PORT_READ_FAILED:
			return messages.promptConflictReadFailed;
		case ReloadConflictErrorKind.INVALID:
			return messages.promptConflictInvalid;
		case ReloadConflictErrorKind.DISPOSED:
			return messages.promptConflictDisposed;
	}
}

export function resolveCloseInvalidDocumentFailureMessage(
	messages: EditorMessages,
	kind: CloseInvalidDocumentErrorKind
): string {
	switch (kind) {
		case CloseInvalidDocumentErrorKind.NOT_FOUND:
			return messages.promptConflictNotFound;
		case CloseInvalidDocumentErrorKind.STALE_REVISION:
			return messages.promptInvalidDocStaleRevision;
		case CloseInvalidDocumentErrorKind.NOT_INVALID:
			return messages.promptInvalidDocNotInvalid;
		case CloseInvalidDocumentErrorKind.EVICT_FAILED:
			return messages.promptInvalidDocCloseFailed;
		case CloseInvalidDocumentErrorKind.DISPOSED:
			return messages.promptInvalidDocDisposed;
	}
}

export interface IntentCloseFailureCopy {
	readonly title: string;
	readonly content: string;
}

export function resolveIntentCloseFailureCopy(
	messages: EditorMessages,
	kind: CloseIntentErrorKind
): IntentCloseFailureCopy {
	switch (kind) {
		case CloseIntentErrorKind.UNSAVED_DRAFT:
			return {
				title: messages.promptCloseFailureUnsavedDraftTitle,
				content: messages.promptCloseFailureUnsavedDraftContent
			};
	}
}
