import { readable, type Readable, writable, type Writable } from 'svelte/store';

import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IPrimitiveCommandRegistry } from '$lib/core/file-tree-v2/commands/command-registry';
import {
	type CreateFileActionInput,
	type CreateFileActionResult,
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type DeleteActionResult,
	type FileTreeActionError,
	FileTreeActionID,
	type FileTreeActionAvailability,
	type FileTreeInputActionAvailability,
	type IFileTreeAction,
	type IFileTreeInputAction,
	type RenameActionInput,
	type RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import { failure, type Result, success } from '$lib/core/shared/models-utils';
import {
	type ActionDialogRequest,
	type ActionDialogRequestInput,
	ActionDialogRequestInputKind,
	type ActionDialogState,
	ActionDialogStateKind,
	type CreateFileRequestInput,
	type CreateFolderRequestInput,
	type DeleteRequestInput,
	type IActionDialogViewModel,
	type ImmediateActionDialogRequest,
	type RenameRequestInput
} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';
import {
	type ILoadable,
	type Loadable,
	LoadableKind
} from '$lib/view-models/shared/ui-models';

export class ActionDialogViewModelImpl implements IActionDialogViewModel {
	private readonly commandRegistry: IPrimitiveCommandRegistry;
	private readonly _state: Writable<ActionDialogState>;

	constructor(commandRegistry: IPrimitiveCommandRegistry) {
		this.commandRegistry = commandRegistry;
		this._state = writable<ActionDialogState>({
			kind: ActionDialogStateKind.CLOSED
		});
	}

	public get state(): Readable<ActionDialogState> {
		return this._state;
	}

	public request(input: ActionDialogRequestInput): Result<void, FileTreeActionError> {
		switch (input.kind) {
			case ActionDialogRequestInputKind.RENAME: {
				const result: Result<void, FileTreeActionError> = this.openRename(input);
				return result;
			}
			case ActionDialogRequestInputKind.CREATE_FILE: {
				const result: Result<void, FileTreeActionError> = this.openCreateFile(input);
				return result;
			}
			case ActionDialogRequestInputKind.CREATE_FOLDER: {
				const result: Result<void, FileTreeActionError> = this.openCreateFolder(input);
				return result;
			}
			case ActionDialogRequestInputKind.DELETE: {
				const result: Result<void, FileTreeActionError> = this.openDelete(input);
				return result;
			}
		}
	}

	public close(): void {
		this._state.set({
			kind: ActionDialogStateKind.CLOSED
		});
	}

	public dispose(): void {
		this.close();
	}

	private openRename(input: RenameRequestInput): Result<void, FileTreeActionError> {
		const primitive: IFileTreeInputAction<RenameActionInput, RenameActionResult> =
			this.commandRegistry.getPrimitive(FileTreeActionID.RENAME);
		const commandContext: FileTreeCommandContext = input.context;
		const availability: FileTreeInputActionAvailability<RenameActionInput> =
			primitive.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const request: ActionDialogRequest<RenameActionInput, RenameActionResult> =
			this.buildInputRequest(
				primitive,
				commandContext,
				availability.contextLabel,
				availability.initialInput
			);
		this._state.set({
			kind: ActionDialogStateKind.OPEN_RENAME,
			request: request
		});

		return success<void>(undefined);
	}

	private openCreateFile(input: CreateFileRequestInput): Result<void, FileTreeActionError> {
		const primitive: IFileTreeInputAction<CreateFileActionInput, CreateFileActionResult> =
			this.commandRegistry.getPrimitive(FileTreeActionID.CREATE_FILE);
		const commandContext: FileTreeCommandContext = input.context;
		const availability: FileTreeInputActionAvailability<CreateFileActionInput> =
			primitive.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const request: ActionDialogRequest<CreateFileActionInput, CreateFileActionResult> =
			this.buildInputRequest(
				primitive,
				commandContext,
				availability.contextLabel,
				availability.initialInput
			);
		this._state.set({
			kind: ActionDialogStateKind.OPEN_CREATE_FILE,
			request: request
		});

		return success<void>(undefined);
	}

	private openCreateFolder(input: CreateFolderRequestInput): Result<void, FileTreeActionError> {
		const primitive: IFileTreeInputAction<CreateFolderActionInput, CreateFolderActionResult> =
			this.commandRegistry.getPrimitive(FileTreeActionID.CREATE_FOLDER);
		const commandContext: FileTreeCommandContext = input.context;
		const availability: FileTreeInputActionAvailability<CreateFolderActionInput> =
			primitive.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const request: ActionDialogRequest<CreateFolderActionInput, CreateFolderActionResult> =
			this.buildInputRequest(
				primitive,
				commandContext,
				availability.contextLabel,
				availability.initialInput
			);
		this._state.set({
			kind: ActionDialogStateKind.OPEN_CREATE_FOLDER,
			request: request
		});

		return success<void>(undefined);
	}

	private openDelete(input: DeleteRequestInput): Result<void, FileTreeActionError> {
		const primitive: IFileTreeAction<DeleteActionResult> =
			this.commandRegistry.getPrimitive(FileTreeActionID.DELETE);
		const commandContext: FileTreeCommandContext = input.context;
		const availability: FileTreeActionAvailability = primitive.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const request: ImmediateActionDialogRequest<DeleteActionResult> = this.buildImmediateRequest(
			primitive,
			commandContext,
			availability.contextLabel
		);
		this._state.set({
			kind: ActionDialogStateKind.OPEN_DELETE,
			request: request
		});

		return success<void>(undefined);
	}

	private buildInputRequest<TInput, TResult>(
		primitive: IFileTreeInputAction<TInput, TResult>,
		commandContext: FileTreeCommandContext,
		contextLabel: string,
		initialInput: TInput
	): ActionDialogRequest<TInput, TResult> {
		const request: ActionDialogRequest<TInput, TResult> = {
			descriptor: primitive.descriptor,
			contextLabel: contextLabel,
			initialInput: initialInput,
			validate: (performInput: TInput): ILoadable<void, FileTreeActionError> => {
				const validationResult: Result<void, FileTreeActionError> = primitive.canPerform(
					commandContext,
					performInput
				);
				const loadable: ILoadable<void, FileTreeActionError> =
					this.createResultLoadable(validationResult);
				return loadable;
			},
			perform: (performInput: TInput): ILoadable<TResult, FileTreeActionError> => {
				const performResult: Promise<Result<TResult, FileTreeActionError>> = primitive.perform(
					commandContext,
					performInput
				);
				const loadable: ILoadable<TResult, FileTreeActionError> =
					this.createPromiseLoadable(performResult);
				return loadable;
			}
		};
		return request;
	}

	private buildImmediateRequest<TResult>(
		primitive: IFileTreeAction<TResult>,
		commandContext: FileTreeCommandContext,
		contextLabel: string
	): ImmediateActionDialogRequest<TResult> {
		const request: ImmediateActionDialogRequest<TResult> = {
			descriptor: primitive.descriptor,
			contextLabel: contextLabel,
			perform: (): ILoadable<TResult, FileTreeActionError> => {
				const performResult: Promise<Result<TResult, FileTreeActionError>> =
					primitive.perform(commandContext);
				const loadable: ILoadable<TResult, FileTreeActionError> =
					this.createPromiseLoadable(performResult);
				return loadable;
			}
		};
		return request;
	}

	private createResultLoadable<TValue>(
		result: Result<TValue, FileTreeActionError>
	): ILoadable<TValue, FileTreeActionError> {
		const loadableState: Loadable<TValue, FileTreeActionError> = this.createLoadableState(result);
		const state: Readable<Loadable<TValue, FileTreeActionError>> = readable(loadableState);
		const loadable: ILoadable<TValue, FileTreeActionError> = {
			state: state
		};
		return loadable;
	}

	private createPromiseLoadable<TValue>(
		result: Promise<Result<TValue, FileTreeActionError>>
	): ILoadable<TValue, FileTreeActionError> {
		const loadingState: Loadable<TValue, FileTreeActionError> = {
			kind: LoadableKind.LOADING
		};
		const state: Writable<Loadable<TValue, FileTreeActionError>> = writable(loadingState);
		void this.resolvePromiseLoadable(result, state);

		const loadable: ILoadable<TValue, FileTreeActionError> = {
			state: state
		};
		return loadable;
	}

	private async resolvePromiseLoadable<TValue>(
		resultPromise: Promise<Result<TValue, FileTreeActionError>>,
		state: Writable<Loadable<TValue, FileTreeActionError>>
	): Promise<void> {
		const result: Result<TValue, FileTreeActionError> = await resultPromise;
		const loadableState: Loadable<TValue, FileTreeActionError> = this.createLoadableState(result);
		state.set(loadableState);
	}

	private createLoadableState<TValue>(
		result: Result<TValue, FileTreeActionError>
	): Loadable<TValue, FileTreeActionError> {
		if (!result.ok) {
			const failureState: Loadable<TValue, FileTreeActionError> = {
				kind: LoadableKind.FAILURE,
				error: result.error
			};
			return failureState;
		}

		const successState: Loadable<TValue, FileTreeActionError> = {
			kind: LoadableKind.SUCCESS,
			value: result.value
		};
		return successState;
	}
}
