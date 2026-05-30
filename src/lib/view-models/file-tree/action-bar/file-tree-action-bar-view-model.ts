import type { Readable } from 'svelte/store';

import type { FileTreeActionError } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { FileTreeSaveCommandError } from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import type { FileTreeUICommandError } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';
import type {
	ActionDialogRequestInput,
	CreateFileRequestInput,
	CreateFolderRequestInput,
	DeleteRequestInput,
	RenameRequestInput
} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';

export enum FileTreeActionIconKind {
	NONE = 'none',
	NAMED = 'named'
}

export interface NoFileTreeActionIcon {
	readonly kind: FileTreeActionIconKind.NONE;
}

export interface NamedFileTreeActionIcon {
	readonly kind: FileTreeActionIconKind.NAMED;
	readonly name: string;
}

export type FileTreeActionIcon = NoFileTreeActionIcon | NamedFileTreeActionIcon;

export enum FileTreeActionAcceleratorKind {
	NONE = 'none',
	KEY_BINDING = 'key-binding'
}

export interface NoFileTreeActionAccelerator {
	readonly kind: FileTreeActionAcceleratorKind.NONE;
}

export interface KeyBindingFileTreeActionAccelerator {
	readonly kind: FileTreeActionAcceleratorKind.KEY_BINDING;
	readonly keyBinding: string;
}

export type FileTreeActionAccelerator =
	| NoFileTreeActionAccelerator
	| KeyBindingFileTreeActionAccelerator;

export enum FileTreeActionAvailabilityKind {
	AVAILABLE = 'available',
	UNAVAILABLE = 'unavailable'
}

export interface AvailableFileTreeActionAvailability<TInput extends ActionDialogRequestInput> {
	readonly kind: FileTreeActionAvailabilityKind.AVAILABLE;
	readonly requestInput: TInput;
}

export interface UnavailableFileTreeActionAvailability {
	readonly kind: FileTreeActionAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeActionError;
}

export type FileTreeActionAvailability<TInput extends ActionDialogRequestInput> =
	| AvailableFileTreeActionAvailability<TInput>
	| UnavailableFileTreeActionAvailability;

export enum FileTreeActionBarPresentationKind {
	CREATE_FILE = 'create-file',
	CREATE_FOLDER = 'create-folder',
	RENAME = 'rename',
	DELETE = 'delete'
}

export interface CreateFileActionBarPresentation {
	readonly kind: FileTreeActionBarPresentationKind.CREATE_FILE;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeActionAvailability<CreateFileRequestInput>;
}

export interface CreateFolderActionBarPresentation {
	readonly kind: FileTreeActionBarPresentationKind.CREATE_FOLDER;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeActionAvailability<CreateFolderRequestInput>;
}

export interface RenameActionBarPresentation {
	readonly kind: FileTreeActionBarPresentationKind.RENAME;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeActionAvailability<RenameRequestInput>;
}

export interface DeleteActionBarPresentation {
	readonly kind: FileTreeActionBarPresentationKind.DELETE;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeActionAvailability<DeleteRequestInput>;
}

export type FileTreeActionBarPresentation =
	| CreateFileActionBarPresentation
	| CreateFolderActionBarPresentation
	| RenameActionBarPresentation
	| DeleteActionBarPresentation;

export interface FileTreeUICommandAvailableAvailability {
	readonly kind: FileTreeActionAvailabilityKind.AVAILABLE;
}

export interface FileTreeUICommandUnavailableAvailability {
	readonly kind: FileTreeActionAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeUICommandError;
}

export type FileTreeUICommandAvailability =
	| FileTreeUICommandAvailableAvailability
	| FileTreeUICommandUnavailableAvailability;

export enum FileTreeUICommandPresentationKind {
	EXPAND_NODE = 'expand-node',
	COLLAPSE_NODE = 'collapse-node',
	LOCATE_ACTIVE_FILE = 'locate-active-file'
}

export interface ExpandNodeUICommandPresentation {
	readonly kind: FileTreeUICommandPresentationKind.EXPAND_NODE;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeUICommandAvailability;
}

export interface CollapseNodeUICommandPresentation {
	readonly kind: FileTreeUICommandPresentationKind.COLLAPSE_NODE;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeUICommandAvailability;
}

export interface LocateActiveFileUICommandPresentation {
	readonly kind: FileTreeUICommandPresentationKind.LOCATE_ACTIVE_FILE;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeUICommandAvailability;
}

export type FileTreeUICommandPresentation =
	| ExpandNodeUICommandPresentation
	| CollapseNodeUICommandPresentation
	| LocateActiveFileUICommandPresentation;

export interface FileTreeSaveCommandAvailableAvailability {
	readonly kind: FileTreeActionAvailabilityKind.AVAILABLE;
}

export interface FileTreeSaveCommandUnavailableAvailability {
	readonly kind: FileTreeActionAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeSaveCommandError;
}

export type FileTreeSaveCommandAvailability =
	| FileTreeSaveCommandAvailableAvailability
	| FileTreeSaveCommandUnavailableAvailability;

export enum FileTreeSaveCommandPresentationKind {
	SAVE_ALL = 'save-all'
}

export interface SaveAllSaveCommandPresentation {
	readonly kind: FileTreeSaveCommandPresentationKind.SAVE_ALL;
	readonly label: string;
	readonly icon: FileTreeActionIcon;
	readonly accelerator: FileTreeActionAccelerator;
	readonly availability: FileTreeSaveCommandAvailability;
}

export type FileTreeSaveCommandPresentation = SaveAllSaveCommandPresentation;

export interface IFileTreeActionBarRequestController {
	request(input: ActionDialogRequestInput): void;
}

export interface IFileTreeUICommandController {
	expandAll(): Promise<void>;

	collapseAll(): Promise<void>;

	revealActiveFile(): Promise<void>;
}

export interface IFileTreeSaveCommandController {
	triggerSaveAll(): Promise<void>;
}

export interface IFileTreeActionBarViewModel
	extends IFileTreeActionBarRequestController,
		IFileTreeUICommandController,
		IFileTreeSaveCommandController {
	readonly createFile: Readable<CreateFileActionBarPresentation>;
	readonly createFolder: Readable<CreateFolderActionBarPresentation>;
	readonly rename: Readable<RenameActionBarPresentation>;
	readonly delete: Readable<DeleteActionBarPresentation>;

	readonly expandNode: Readable<ExpandNodeUICommandPresentation>;
	readonly collapseNode: Readable<CollapseNodeUICommandPresentation>;
	readonly locateActiveFile: Readable<LocateActiveFileUICommandPresentation>;

	readonly saveAll: Readable<SaveAllSaveCommandPresentation>;
}
