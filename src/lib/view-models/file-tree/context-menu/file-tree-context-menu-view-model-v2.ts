import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	FileTreeActionDescriptor,
	FileTreeActionError
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

export enum FileTreeContextMenuActionKind {
	CREATE_FILE = 'create-file',
	CREATE_FOLDER = 'create-folder',
	RENAME = 'rename',
	DELETE = 'delete',
	COPY_PATH = 'copy-path'
}

export enum FileTreeContextMenuIconKind {
	NONE = 'none',
	NAMED = 'named'
}

export interface NoFileTreeContextMenuIcon {
	readonly kind: FileTreeContextMenuIconKind.NONE;
}

export interface NamedFileTreeContextMenuIcon {
	readonly kind: FileTreeContextMenuIconKind.NAMED;
	readonly name: string;
}

export type FileTreeContextMenuIcon = NoFileTreeContextMenuIcon | NamedFileTreeContextMenuIcon;

export enum FileTreeContextMenuAcceleratorKind {
	NONE = 'none',
	KEY_BINDING = 'key-binding'
}

export interface NoFileTreeContextMenuAccelerator {
	readonly kind: FileTreeContextMenuAcceleratorKind.NONE;
}

export interface KeyBindingFileTreeContextMenuAccelerator {
	readonly kind: FileTreeContextMenuAcceleratorKind.KEY_BINDING;
	readonly keyBinding: string;
}

export type FileTreeContextMenuAccelerator =
	| NoFileTreeContextMenuAccelerator
	| KeyBindingFileTreeContextMenuAccelerator;

export enum FileTreeContextMenuActionAvailabilityKind {
	AVAILABLE = 'available',
	UNAVAILABLE = 'unavailable'
}

export enum AvailableFileTreeContextMenuActionKind {
	PERFORM = 'perform',
	DELIVER = 'deliver'
}

export interface PerformAvailableFileTreeContextMenuAction {
	readonly kind: FileTreeContextMenuActionAvailabilityKind.AVAILABLE;
	readonly availableKind: AvailableFileTreeContextMenuActionKind.PERFORM;
	perform(): void;
}

export interface DeliverAvailableFileTreeContextMenuAction {
	readonly kind: FileTreeContextMenuActionAvailabilityKind.AVAILABLE;
	readonly availableKind: AvailableFileTreeContextMenuActionKind.DELIVER;
	deliver(): Promise<void>;
}

export type AvailableFileTreeContextMenuAction =
	| PerformAvailableFileTreeContextMenuAction
	| DeliverAvailableFileTreeContextMenuAction;

export interface UnavailableFileTreeContextMenuAction {
	readonly kind: FileTreeContextMenuActionAvailabilityKind.UNAVAILABLE;
	readonly reason: FileTreeActionError;
}

export type FileTreeContextMenuActionAvailability =
	| AvailableFileTreeContextMenuAction
	| UnavailableFileTreeContextMenuAction;

export interface CreateFileContextMenuActionItem {
	readonly kind: FileTreeContextMenuActionKind.CREATE_FILE;
	readonly descriptor: FileTreeActionDescriptor;
	readonly icon: FileTreeContextMenuIcon;
	readonly accelerator: FileTreeContextMenuAccelerator;
	readonly availability: FileTreeContextMenuActionAvailability;
}

export interface CreateFolderContextMenuActionItem {
	readonly kind: FileTreeContextMenuActionKind.CREATE_FOLDER;
	readonly descriptor: FileTreeActionDescriptor;
	readonly icon: FileTreeContextMenuIcon;
	readonly accelerator: FileTreeContextMenuAccelerator;
	readonly availability: FileTreeContextMenuActionAvailability;
}

export interface RenameContextMenuActionItem {
	readonly kind: FileTreeContextMenuActionKind.RENAME;
	readonly descriptor: FileTreeActionDescriptor;
	readonly icon: FileTreeContextMenuIcon;
	readonly accelerator: FileTreeContextMenuAccelerator;
	readonly availability: FileTreeContextMenuActionAvailability;
}

export interface DeleteContextMenuActionItem {
	readonly kind: FileTreeContextMenuActionKind.DELETE;
	readonly descriptor: FileTreeActionDescriptor;
	readonly icon: FileTreeContextMenuIcon;
	readonly accelerator: FileTreeContextMenuAccelerator;
	readonly availability: FileTreeContextMenuActionAvailability;
}

export interface CopyPathContextMenuActionItem {
	readonly kind: FileTreeContextMenuActionKind.COPY_PATH;
	readonly descriptor: FileTreeActionDescriptor;
	readonly icon: FileTreeContextMenuIcon;
	readonly accelerator: FileTreeContextMenuAccelerator;
	readonly availability: FileTreeContextMenuActionAvailability;
}

export type FileTreeContextMenuActionItem =
	| CreateFileContextMenuActionItem
	| CreateFolderContextMenuActionItem
	| RenameContextMenuActionItem
	| DeleteContextMenuActionItem
	| CopyPathContextMenuActionItem;

export interface FileTreeContextMenuCapabilities {
	readonly actions: ReadonlyArray<FileTreeContextMenuActionItem>;
}

export enum FileTreeContextTargetKind {
	TARGETED = 'targeted',
	UNTARGETED = 'untargeted'
}

export interface TargetedFileTreeContextTarget {
	readonly kind: FileTreeContextTargetKind.TARGETED;
	readonly nodeID: NodeID;
}

export interface UntargetedFileTreeContextTarget {
	readonly kind: FileTreeContextTargetKind.UNTARGETED;
}

export type FileTreeContextTarget = TargetedFileTreeContextTarget | UntargetedFileTreeContextTarget;

export interface IFileTreeContextMenuViewModelV2 {
	capabilitiesFor(target: FileTreeContextTarget): FileTreeContextMenuCapabilities;
}
