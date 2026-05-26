import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure } from '$lib/core/shared/models-utils';
import type {
	CommandDescriptor,
	ICommand
} from '$lib/core/file-tree-v2/commands/command';

export enum FileTreeUICommandID {
	EXPAND_NODE = 'file-tree.ui.expand-node',
	COLLAPSE_NODE = 'file-tree.ui.collapse-node',
	LOCATE_ACTIVE_FILE = 'file-tree.ui.locate-active-file'
}

export type FileTreeUICommandDescriptor = CommandDescriptor<FileTreeUICommandID>;

export const EXPAND_NODE_UI_COMMAND_DESCRIPTOR: FileTreeUICommandDescriptor = {
	id: FileTreeUICommandID.EXPAND_NODE,
	label: 'Expand All',
	description: 'Expand every folder in the tree'
};

export const COLLAPSE_NODE_UI_COMMAND_DESCRIPTOR: FileTreeUICommandDescriptor = {
	id: FileTreeUICommandID.COLLAPSE_NODE,
	label: 'Collapse All',
	description: 'Collapse every folder in the tree'
};

export const LOCATE_ACTIVE_FILE_UI_COMMAND_DESCRIPTOR: FileTreeUICommandDescriptor = {
	id: FileTreeUICommandID.LOCATE_ACTIVE_FILE,
	label: 'Locate File',
	description: 'Reveal the active file in the file tree'
};

export interface LocateActiveFileUICommandResult {
	readonly locatedNodeID: NodeID;
}

export enum FileTreeUICommandErrorKind {
	ACTION_DISABLED = 'action-disabled',
	MISSING_SELECTION = 'missing-selection',
	MISSING_ACTIVE_FILE = 'missing-active-file',
	MISSING_NODE = 'missing-node',
	TARGET_NOT_FOLDER = 'target-not-folder',
	ALREADY_EXPANDED = 'already-expanded',
	ALREADY_COLLAPSED = 'already-collapsed'
}

export type FileTreeUICommandError = OperationFailure<FileTreeUICommandErrorKind>;

export type IFileTreeUICommand<PerformValue = void> = ICommand<
	FileTreeUICommandID,
	PerformValue,
	FileTreeUICommandError
>;
