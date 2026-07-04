import type { EditorMessages } from '$lib/core/localization/localization-models';
import {
	FileTreeUICommandErrorKind,
	FileTreeUICommandID,
	type FileTreeUICommandError
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

export function resolveFileTreeUICommandLabel(
	messages: EditorMessages,
	id: FileTreeUICommandID
): string {
	switch (id) {
		case FileTreeUICommandID.EXPAND_NODE:
			return messages.fileTreeUiCommandExpandNodeLabel;
		case FileTreeUICommandID.COLLAPSE_NODE:
			return messages.fileTreeUiCommandCollapseNodeLabel;
		case FileTreeUICommandID.LOCATE_ACTIVE_FILE:
			return messages.fileTreeUiCommandLocateActiveFileLabel;
	}
}

export function resolveFileTreeUICommandErrorContent(
	messages: EditorMessages,
	error: FileTreeUICommandError
): string {
	switch (error.kind) {
		case FileTreeUICommandErrorKind.ACTION_DISABLED:
			return messages.fileTreeErrorActionDisabled;
		case FileTreeUICommandErrorKind.MISSING_SELECTION:
			return messages.fileTreeErrorMissingSelection;
		case FileTreeUICommandErrorKind.MISSING_ACTIVE_FILE:
			return messages.fileTreeErrorMissingActiveFile;
		case FileTreeUICommandErrorKind.MISSING_NODE:
			return messages.fileTreeErrorMissingNode;
		case FileTreeUICommandErrorKind.TARGET_NOT_FOLDER:
			return messages.fileTreeErrorTargetNotFolder;
		case FileTreeUICommandErrorKind.ALREADY_EXPANDED:
			return messages.fileTreeErrorAlreadyExpanded;
		case FileTreeUICommandErrorKind.ALREADY_COLLAPSED:
			return messages.fileTreeErrorAlreadyCollapsed;
	}
}
