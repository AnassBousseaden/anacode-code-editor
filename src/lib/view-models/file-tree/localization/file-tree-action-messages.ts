import {
	formatMessage,
	resolveErrorContent,
	resolveLabel,
	type EditorMessageKey,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import { DUPLICATE_NAME_ERROR_CODE } from '$lib/core/file-system/commands/file-system-commands-impl-utils';
import {
	FileTreeActionErrorKind,
	FileTreeActionID,
	type FileTreeActionError
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

/**
 * Presentation-edge mapping from a file-system action id to its localized
 * label key. Core descriptors keep their English `label` for diagnostics; the
 * view-model layer resolves the user-facing label from this table. Shared by
 * the action-bar and dialog view surfaces.
 */
export const FILE_TREE_ACTION_LABEL_KEYS: Readonly<Record<FileTreeActionID, EditorMessageKey>> = {
	[FileTreeActionID.CREATE_FILE]: 'fileTree.action.createFile.label',
	[FileTreeActionID.CREATE_FOLDER]: 'fileTree.action.createFolder.label',
	[FileTreeActionID.DELETE]: 'fileTree.command.delete',
	[FileTreeActionID.COPY_PATH]: 'fileTree.command.copyPath',
	[FileTreeActionID.RENAME]: 'fileTree.command.rename',
	[FileTreeActionID.MOVE]: 'fileTree.action.move.label'
};

/** Localized label for a file-system action id. */
export function resolveFileTreeActionLabel(messages: EditorMessages, id: FileTreeActionID): string {
	return resolveLabel(FILE_TREE_ACTION_LABEL_KEYS, messages, id);
}

/**
 * Presentation-edge mapping from a file-system action error kind to its
 * localized content key. The domain error's diagnostic `message` is never
 * rendered once a kind mapping exists.
 */
export const FILE_TREE_ACTION_ERROR_KEYS: Readonly<
	Record<FileTreeActionErrorKind, EditorMessageKey>
> = {
	[FileTreeActionErrorKind.ACTION_DISABLED]: 'fileTree.error.actionDisabled',
	[FileTreeActionErrorKind.MISSING_SELECTION]: 'fileTree.error.missingSelection',
	[FileTreeActionErrorKind.MISSING_NODE]: 'fileTree.error.missingNode',
	[FileTreeActionErrorKind.MISSING_NAME]: 'fileTree.error.missingName',
	[FileTreeActionErrorKind.PERMISSION_DENIED]: 'fileTree.error.permissionDenied',
	[FileTreeActionErrorKind.INVALID_TARGET]: 'fileTree.error.invalidTarget',
	[FileTreeActionErrorKind.FILE_SYSTEM_ERROR]: 'fileTree.error.fileSystem',
	[FileTreeActionErrorKind.UNSAVED_DRAFT]: 'fileTree.error.unsavedDraft'
};

/** Localized, user-facing content for a file-system action error. */
export function resolveFileTreeActionErrorContent(
	messages: EditorMessages,
	error: FileTreeActionError
): string {
	if (
		error.kind === FileTreeActionErrorKind.FILE_SYSTEM_ERROR &&
		error.code === DUPLICATE_NAME_ERROR_CODE
	) {
		return formatMessage(messages['fileTree.error.nameExists'], error.params);
	}
	return resolveErrorContent(FILE_TREE_ACTION_ERROR_KEYS, messages, error);
}
