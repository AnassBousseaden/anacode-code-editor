import type { IDisposable1 } from '$lib/core/shared/models-utils';
import type {
	IBundledCommand,
	IBundledInputCommand
} from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type CopyPathActionResult,
	type CreateFileActionInput,
	type CreateFileActionResult,
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type DeleteActionResult,
	FileTreeActionID,
	type FileTreeActionError,
	type IFileTreeAction,
	type IFileTreeInputAction,
	type MoveActionInput,
	type MoveActionResult,
	type RenameActionInput,
	type RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import {
	type FileTreeSaveCommandError,
	FileTreeSaveCommandID,
	type IFileTreeSaveCommand,
	type SaveAllCommandResult
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import {
	type FileTreeUICommandError,
	FileTreeUICommandID,
	type IFileTreeUICommand,
	type LocateActiveFileUICommandResult
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

export interface FileTreeActionBundleTypeMap {
	[FileTreeActionID.CREATE_FILE]: IBundledInputCommand<
		FileTreeActionID,
		CreateFileActionInput,
		CreateFileActionResult,
		FileTreeActionError
	>;
	[FileTreeActionID.CREATE_FOLDER]: IBundledInputCommand<
		FileTreeActionID,
		CreateFolderActionInput,
		CreateFolderActionResult,
		FileTreeActionError
	>;
	[FileTreeActionID.RENAME]: IBundledInputCommand<
		FileTreeActionID,
		RenameActionInput,
		RenameActionResult,
		FileTreeActionError
	>;
	[FileTreeActionID.DELETE]: IBundledCommand<
		FileTreeActionID,
		DeleteActionResult,
		FileTreeActionError
	>;
	[FileTreeActionID.COPY_PATH]: IBundledCommand<
		FileTreeActionID,
		CopyPathActionResult,
		FileTreeActionError
	>;
	[FileTreeActionID.MOVE]: IBundledInputCommand<
		FileTreeActionID,
		MoveActionInput,
		MoveActionResult,
		FileTreeActionError
	>;
}

export interface FileTreeUICommandBundleTypeMap {
	[FileTreeUICommandID.EXPAND_NODE]: IBundledCommand<
		FileTreeUICommandID,
		void,
		FileTreeUICommandError
	>;
	[FileTreeUICommandID.COLLAPSE_NODE]: IBundledCommand<
		FileTreeUICommandID,
		void,
		FileTreeUICommandError
	>;
	[FileTreeUICommandID.LOCATE_ACTIVE_FILE]: IBundledCommand<
		FileTreeUICommandID,
		LocateActiveFileUICommandResult,
		FileTreeUICommandError
	>;
}

export interface FileTreeSaveCommandBundleTypeMap {
	[FileTreeSaveCommandID.SAVE_ALL]: IBundledCommand<
		FileTreeSaveCommandID,
		SaveAllCommandResult,
		FileTreeSaveCommandError
	>;
}

export type CommandBundleTypeMap = FileTreeActionBundleTypeMap &
	FileTreeUICommandBundleTypeMap &
	FileTreeSaveCommandBundleTypeMap;

export type CommandID = keyof CommandBundleTypeMap;

export interface FileTreeActionPrimitiveTypeMap {
	[FileTreeActionID.CREATE_FILE]: IFileTreeInputAction<
		CreateFileActionInput,
		CreateFileActionResult
	>;
	[FileTreeActionID.CREATE_FOLDER]: IFileTreeInputAction<
		CreateFolderActionInput,
		CreateFolderActionResult
	>;
	[FileTreeActionID.RENAME]: IFileTreeInputAction<RenameActionInput, RenameActionResult>;
	[FileTreeActionID.DELETE]: IFileTreeAction<DeleteActionResult>;
	[FileTreeActionID.COPY_PATH]: IFileTreeAction<CopyPathActionResult>;
	[FileTreeActionID.MOVE]: IFileTreeInputAction<MoveActionInput, MoveActionResult>;
}

export interface FileTreeUICommandPrimitiveTypeMap {
	[FileTreeUICommandID.EXPAND_NODE]: IFileTreeUICommand;
	[FileTreeUICommandID.COLLAPSE_NODE]: IFileTreeUICommand;
	[FileTreeUICommandID.LOCATE_ACTIVE_FILE]: IFileTreeUICommand<LocateActiveFileUICommandResult>;
}

export interface FileTreeSaveCommandPrimitiveTypeMap {
	[FileTreeSaveCommandID.SAVE_ALL]: IFileTreeSaveCommand<SaveAllCommandResult>;
}

export type PrimitiveCommandTypeMap = FileTreeActionPrimitiveTypeMap &
	FileTreeUICommandPrimitiveTypeMap &
	FileTreeSaveCommandPrimitiveTypeMap;

export type CommandTypeMap = CommandBundleTypeMap;

export interface ICommandRegistry extends IDisposable1 {
	getCommand<K extends CommandID>(commandID: K): CommandBundleTypeMap[K];
}

export interface IPrimitiveCommandRegistry {
	getPrimitive<K extends CommandID>(commandID: K): PrimitiveCommandTypeMap[K];
}
