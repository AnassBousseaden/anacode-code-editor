import type { Readable } from 'svelte/store';

import type { FileTreeCommandContext } from '$lib/core/file-tree-v2/commands/command';
import type {
	CreateFileActionInput,
	CreateFileActionResult,
	CreateFolderActionInput,
	CreateFolderActionResult,
	DeleteActionResult,
	FileTreeActionDescriptor,
	FileTreeActionError,
	RenameActionInput,
	RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IDisposable1, Result } from '$lib/core/shared/models-utils';
import type { ILoadable } from '$lib/view-models/shared/ui-models';

export enum ActionDialogStateKind {
	CLOSED = 'closed',
	OPEN_RENAME = 'open-rename',
	OPEN_CREATE_FILE = 'open-create-file',
	OPEN_CREATE_FOLDER = 'open-create-folder',
	OPEN_DELETE = 'open-delete'
}

export interface ActionDialogRequest<TInput, TResult> {
	readonly descriptor: FileTreeActionDescriptor;
	readonly contextLabel: string;
	readonly initialInput: TInput;
	readonly validate: (input: TInput) => ILoadable<void, FileTreeActionError>;
	readonly perform: (input: TInput) => ILoadable<TResult, FileTreeActionError>;
}

export interface ImmediateActionDialogRequest<TResult> {
	readonly descriptor: FileTreeActionDescriptor;
	readonly contextLabel: string;
	readonly perform: () => ILoadable<TResult, FileTreeActionError>;
}

export interface ClosedActionDialogState {
	readonly kind: ActionDialogStateKind.CLOSED;
}

export interface OpenRenameDialogState {
	readonly kind: ActionDialogStateKind.OPEN_RENAME;
	readonly request: ActionDialogRequest<RenameActionInput, RenameActionResult>;
}

export interface OpenCreateFileDialogState {
	readonly kind: ActionDialogStateKind.OPEN_CREATE_FILE;
	readonly request: ActionDialogRequest<CreateFileActionInput, CreateFileActionResult>;
}

export interface OpenCreateFolderDialogState {
	readonly kind: ActionDialogStateKind.OPEN_CREATE_FOLDER;
	readonly request: ActionDialogRequest<CreateFolderActionInput, CreateFolderActionResult>;
}

export interface OpenDeleteDialogState {
	readonly kind: ActionDialogStateKind.OPEN_DELETE;
	readonly request: ImmediateActionDialogRequest<DeleteActionResult>;
}

export type OpenActionDialogState =
	| OpenRenameDialogState
	| OpenCreateFileDialogState
	| OpenCreateFolderDialogState
	| OpenDeleteDialogState;

export type ActionDialogState = ClosedActionDialogState | OpenActionDialogState;

export enum ActionDialogRequestInputKind {
	RENAME = 'rename',
	CREATE_FILE = 'create-file',
	CREATE_FOLDER = 'create-folder',
	DELETE = 'delete'
}

export interface RenameRequestInput {
	readonly kind: ActionDialogRequestInputKind.RENAME;
	readonly context: FileTreeCommandContext;
}

export interface CreateFileRequestInput {
	readonly kind: ActionDialogRequestInputKind.CREATE_FILE;
	readonly context: FileTreeCommandContext;
}

export interface CreateFolderRequestInput {
	readonly kind: ActionDialogRequestInputKind.CREATE_FOLDER;
	readonly context: FileTreeCommandContext;
}

export interface DeleteRequestInput {
	readonly kind: ActionDialogRequestInputKind.DELETE;
	readonly context: FileTreeCommandContext;
}

export type ActionDialogRequestInput =
	| RenameRequestInput
	| CreateFileRequestInput
	| CreateFolderRequestInput
	| DeleteRequestInput;

export interface IActionDialogRequestController {
	request(input: ActionDialogRequestInput): Result<void, FileTreeActionError>;
}

export interface IActionDialogViewController {
	close(): void;
}

export interface IActionDialogViewModel
	extends IActionDialogRequestController, IActionDialogViewController, IDisposable1 {
	readonly state: Readable<ActionDialogState>;
}
