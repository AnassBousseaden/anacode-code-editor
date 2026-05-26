import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure } from '$lib/core/shared/models-utils';
import type {
	CommandDescriptor,
	ICommand
} from '$lib/core/file-tree-v2/commands/command';

export enum FileTreeSaveCommandID {
	SAVE = 'file-tree.save.save',
	SAVE_ALL = 'file-tree.save.save-all'
}

export type FileTreeSaveCommandDescriptor = CommandDescriptor<FileTreeSaveCommandID>;

export const SAVE_COMMAND_DESCRIPTOR: FileTreeSaveCommandDescriptor = {
	id: FileTreeSaveCommandID.SAVE,
	label: 'Save',
	description: 'Save the active file'
};

export const SAVE_ALL_COMMAND_DESCRIPTOR: FileTreeSaveCommandDescriptor = {
	id: FileTreeSaveCommandID.SAVE_ALL,
	label: 'Save All',
	description: 'Save every file with unsaved changes'
};

export interface SaveCommandResult {
	readonly savedNodeID: NodeID;
}

export type SaveAllCommandResult = Record<string, never>;

export enum FileTreeSaveCommandErrorKind {
	ACTION_DISABLED = 'action-disabled',
	MISSING_TARGET = 'missing-target',
	MISSING_NODE = 'missing-node',
	TARGET_NOT_FILE = 'target-not-file',
	NOTHING_TO_SAVE = 'nothing-to-save',
	SAVE_ERROR = 'save-error'
}

export type FileTreeSaveCommandError = OperationFailure<FileTreeSaveCommandErrorKind>;

export type IFileTreeSaveCommand<PerformValue = void> = ICommand<
	FileTreeSaveCommandID,
	PerformValue,
	FileTreeSaveCommandError
>;
