import type { EditorMessages } from '$lib/core/localization/localization-models';
import {
	FileTreeSaveCommandErrorKind,
	FileTreeSaveCommandID,
	type FileTreeSaveCommandError
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';

export function resolveFileTreeSaveCommandLabel(
	messages: EditorMessages,
	id: FileTreeSaveCommandID
): string {
	switch (id) {
		case FileTreeSaveCommandID.SAVE:
			return messages.fileTreeSaveCommandSaveLabel;
		case FileTreeSaveCommandID.SAVE_ALL:
			return messages.fileTreeSaveCommandSaveAllLabel;
	}
}

export function resolveFileTreeSaveCommandErrorContent(
	messages: EditorMessages,
	error: FileTreeSaveCommandError
): string {
	switch (error.kind) {
		case FileTreeSaveCommandErrorKind.ACTION_DISABLED:
			return messages.fileTreeErrorActionDisabled;
		case FileTreeSaveCommandErrorKind.MISSING_TARGET:
			return messages.fileTreeErrorMissingTarget;
		case FileTreeSaveCommandErrorKind.MISSING_NODE:
			return messages.fileTreeErrorMissingNode;
		case FileTreeSaveCommandErrorKind.TARGET_NOT_FILE:
			return messages.fileTreeErrorTargetNotFile;
		case FileTreeSaveCommandErrorKind.NOTHING_TO_SAVE:
			return messages.fileTreeErrorNothingToSave;
		case FileTreeSaveCommandErrorKind.SAVE_ERROR:
			return messages.fileTreeErrorSaveFailed;
	}
}
