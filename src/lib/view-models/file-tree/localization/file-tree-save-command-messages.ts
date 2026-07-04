import {
	resolveErrorContent,
	resolveLabel,
	type EditorMessageKey,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import {
	FileTreeSaveCommandErrorKind,
	FileTreeSaveCommandID,
	type FileTreeSaveCommandError
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';

/**
 * Presentation-edge mapping from a save command id to its localized label key.
 * Shared by the action-bar view surface.
 */
export const FILE_TREE_SAVE_COMMAND_LABEL_KEYS: Readonly<
	Record<FileTreeSaveCommandID, EditorMessageKey>
> = {
	[FileTreeSaveCommandID.SAVE]: 'fileTree.saveCommand.save.label',
	[FileTreeSaveCommandID.SAVE_ALL]: 'fileTree.saveCommand.saveAll.label'
};

/** Localized label for a save command id. */
export function resolveFileTreeSaveCommandLabel(
	messages: EditorMessages,
	id: FileTreeSaveCommandID
): string {
	return resolveLabel(FILE_TREE_SAVE_COMMAND_LABEL_KEYS, messages, id);
}

/** Presentation-edge mapping from a save command error kind to its content key. */
export const FILE_TREE_SAVE_COMMAND_ERROR_KEYS: Readonly<
	Record<FileTreeSaveCommandErrorKind, EditorMessageKey>
> = {
	[FileTreeSaveCommandErrorKind.ACTION_DISABLED]: 'fileTree.error.actionDisabled',
	[FileTreeSaveCommandErrorKind.MISSING_TARGET]: 'fileTree.error.missingTarget',
	[FileTreeSaveCommandErrorKind.MISSING_NODE]: 'fileTree.error.missingNode',
	[FileTreeSaveCommandErrorKind.TARGET_NOT_FILE]: 'fileTree.error.targetNotFile',
	[FileTreeSaveCommandErrorKind.NOTHING_TO_SAVE]: 'fileTree.error.nothingToSave',
	[FileTreeSaveCommandErrorKind.SAVE_ERROR]: 'fileTree.error.saveFailed'
};

/** Localized, user-facing content for a save command error. */
export function resolveFileTreeSaveCommandErrorContent(
	messages: EditorMessages,
	error: FileTreeSaveCommandError
): string {
	return resolveErrorContent(FILE_TREE_SAVE_COMMAND_ERROR_KEYS, messages, error);
}
