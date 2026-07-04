import type { EditorMessages } from '$lib/core/localization/localization-models';
import { DUPLICATE_NAME_ERROR_CODE } from '$lib/core/file-system/commands/file-system-commands-impl-utils';
import {
	FileTreeActionErrorKind,
	FileTreeActionID,
	type FileTreeActionError
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

export function resolveFileTreeActionLabel(messages: EditorMessages, id: FileTreeActionID): string {
	switch (id) {
		case FileTreeActionID.CREATE_FILE:
			return messages.fileTreeActionCreateFileLabel;
		case FileTreeActionID.CREATE_FOLDER:
			return messages.fileTreeActionCreateFolderLabel;
		case FileTreeActionID.DELETE:
			return messages.fileTreeCommandDelete;
		case FileTreeActionID.COPY_PATH:
			return messages.fileTreeCommandCopyPath;
		case FileTreeActionID.RENAME:
			return messages.fileTreeCommandRename;
		case FileTreeActionID.MOVE:
			return messages.fileTreeActionMoveLabel;
	}
}

export function resolveFileTreeActionErrorContent(
	messages: EditorMessages,
	error: FileTreeActionError
): string {
	switch (error.kind) {
		case FileTreeActionErrorKind.ACTION_DISABLED:
			return messages.fileTreeErrorActionDisabled;
		case FileTreeActionErrorKind.MISSING_SELECTION:
			return messages.fileTreeErrorMissingSelection;
		case FileTreeActionErrorKind.MISSING_NODE:
			return messages.fileTreeErrorMissingNode;
		case FileTreeActionErrorKind.MISSING_NAME:
			return messages.fileTreeErrorMissingName;
		case FileTreeActionErrorKind.PERMISSION_DENIED:
			return messages.fileTreeErrorPermissionDenied;
		case FileTreeActionErrorKind.INVALID_TARGET:
			return messages.fileTreeErrorInvalidTarget;
		case FileTreeActionErrorKind.FILE_SYSTEM_ERROR:
			if (error.code === DUPLICATE_NAME_ERROR_CODE) {
				return messages.fileTreeErrorNameExists({ name: String(error.params?.name ?? '') });
			}
			return messages.fileTreeErrorFileSystem;
		case FileTreeActionErrorKind.UNSAVED_DRAFT:
			return messages.fileTreeErrorUnsavedDraft;
	}
}
