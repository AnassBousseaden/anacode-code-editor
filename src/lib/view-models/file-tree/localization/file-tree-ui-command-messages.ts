import {
	resolveErrorContent,
	resolveLabel,
	type EditorMessageKey,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import {
	FileTreeUICommandErrorKind,
	FileTreeUICommandID,
	type FileTreeUICommandError
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

/**
 * Presentation-edge mapping from a UI command id to its localized label key.
 * Shared by the action-bar view surface.
 */
export const FILE_TREE_UI_COMMAND_LABEL_KEYS: Readonly<
	Record<FileTreeUICommandID, EditorMessageKey>
> = {
	[FileTreeUICommandID.EXPAND_NODE]: 'fileTree.uiCommand.expandNode.label',
	[FileTreeUICommandID.COLLAPSE_NODE]: 'fileTree.uiCommand.collapseNode.label',
	[FileTreeUICommandID.LOCATE_ACTIVE_FILE]: 'fileTree.uiCommand.locateActiveFile.label'
};

/** Localized label for a UI command id. */
export function resolveFileTreeUICommandLabel(
	messages: EditorMessages,
	id: FileTreeUICommandID
): string {
	return resolveLabel(FILE_TREE_UI_COMMAND_LABEL_KEYS, messages, id);
}

/** Presentation-edge mapping from a UI command error kind to its content key. */
export const FILE_TREE_UI_COMMAND_ERROR_KEYS: Readonly<
	Record<FileTreeUICommandErrorKind, EditorMessageKey>
> = {
	[FileTreeUICommandErrorKind.ACTION_DISABLED]: 'fileTree.error.actionDisabled',
	[FileTreeUICommandErrorKind.MISSING_SELECTION]: 'fileTree.error.missingSelection',
	[FileTreeUICommandErrorKind.MISSING_ACTIVE_FILE]: 'fileTree.error.missingActiveFile',
	[FileTreeUICommandErrorKind.MISSING_NODE]: 'fileTree.error.missingNode',
	[FileTreeUICommandErrorKind.TARGET_NOT_FOLDER]: 'fileTree.error.targetNotFolder',
	[FileTreeUICommandErrorKind.ALREADY_EXPANDED]: 'fileTree.error.alreadyExpanded',
	[FileTreeUICommandErrorKind.ALREADY_COLLAPSED]: 'fileTree.error.alreadyCollapsed'
};

/** Localized, user-facing content for a UI command error. */
export function resolveFileTreeUICommandErrorContent(
	messages: EditorMessages,
	error: FileTreeUICommandError
): string {
	return resolveErrorContent(FILE_TREE_UI_COMMAND_ERROR_KEYS, messages, error);
}
