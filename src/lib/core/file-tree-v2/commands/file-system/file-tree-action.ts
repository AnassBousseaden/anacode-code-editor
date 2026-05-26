import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure } from '$lib/core/shared/models-utils';

import {
	CommandAvailabilityKind,
	type CommandDescriptor,
	type FileTreeCommandContext,
	type ICommand,
	type IInputCommand
} from '$lib/core/file-tree-v2/commands/command';

export enum FileTreeActionID {
	CREATE_FILE = 'file-tree.create-file',
	CREATE_FOLDER = 'file-tree.create-folder',
	DELETE = 'file-tree.delete',
	COPY_PATH = 'file-tree.copy-path',
	RENAME = 'file-tree.rename',
	MOVE = 'file-tree.move'
}

export type FileTreeActionDescriptor = CommandDescriptor<FileTreeActionID>;

export interface AvailableFileTreeActionAvailability {
	readonly kind: CommandAvailabilityKind.AVAILABLE;
	readonly contextLabel: string;
}

export interface UnavailableFileTreeActionAvailability {
	readonly kind: CommandAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeActionError;
}

export type FileTreeActionAvailability =
	| AvailableFileTreeActionAvailability
	| UnavailableFileTreeActionAvailability;

export interface AvailableFileTreeInputActionAvailability<PerformInput> {
	readonly kind: CommandAvailabilityKind.AVAILABLE;
	readonly initialInput: PerformInput;
	readonly contextLabel: string;
}

export interface UnavailableFileTreeInputActionAvailability {
	readonly kind: CommandAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeActionError;
}

export type FileTreeInputActionAvailability<PerformInput> =
	| AvailableFileTreeInputActionAvailability<PerformInput>
	| UnavailableFileTreeInputActionAvailability;

export const CREATE_FILE_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.CREATE_FILE,
	label: 'Create File',
	description: 'Create a new file'
};

export const CREATE_FOLDER_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.CREATE_FOLDER,
	label: 'Create Folder',
	description: 'Create a new folder'
};

export const DELETE_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.DELETE,
	label: 'Delete',
	description: 'Delete the selected node'
};

export const COPY_PATH_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.COPY_PATH,
	label: 'Copy Path',
	description: 'Copy the absolute path of the selected node'
};

export const RENAME_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.RENAME,
	label: 'Rename',
	description: 'Rename the selected node'
};

export const MOVE_ACTION_DESCRIPTOR: FileTreeActionDescriptor = {
	id: FileTreeActionID.MOVE,
	label: 'Move',
	description: 'Move the selected node'
};

export interface CreateFileActionInput {
	readonly name: string;
}

export interface CreateFileActionResult {
	readonly createdNodeID: NodeID;
}

export interface CreateFolderActionInput {
	readonly name: string;
}

export interface CreateFolderActionResult {
	readonly createdNodeID: NodeID;
}

export interface RenameActionInput {
	readonly newName: string;
}

export interface RenameActionResult {
	readonly renamedNodeID: NodeID;
	readonly oldName: string;
	readonly newName: string;
}

export interface DeleteActionResult {
	readonly deletedNodeID: NodeID;
	readonly deletedNodeName: string;
	readonly deletedPath: string;
}

export interface CopyPathActionResult {
	readonly copiedPath: string;
}

export interface MoveActionInput {
	readonly targetNodeID: NodeID | null;
}

export interface MoveActionResult {
	readonly movedNodeID: NodeID;
	readonly movedNodeName: string;
	readonly oldParentID: NodeID | null;
	readonly newParentID: NodeID;
}

export enum FileTreeActionErrorKind {
	ACTION_DISABLED = 'action-disabled',
	MISSING_SELECTION = 'missing-selection',
	MISSING_NODE = 'missing-node',
	MISSING_NAME = 'missing-name',
	PERMISSION_DENIED = 'permission-denied',
	INVALID_TARGET = 'invalid-target',
	FILE_SYSTEM_ERROR = 'file-system-error',
	UNSAVED_DRAFT = 'unsaved-draft'
}

export type FileTreeActionError = OperationFailure<FileTreeActionErrorKind>;

export interface IFileTreeAction<PerformValue = void> extends ICommand<
	FileTreeActionID,
	PerformValue,
	FileTreeActionError
> {
	getAvailability(commandContext: FileTreeCommandContext): FileTreeActionAvailability;
}

export interface IFileTreeInputAction<PerformInput, PerformValue = void> extends IInputCommand<
	FileTreeActionID,
	PerformInput,
	PerformValue,
	FileTreeActionError
> {
	getAvailability(
		commandContext: FileTreeCommandContext
	): FileTreeInputActionAvailability<PerformInput>;
}
