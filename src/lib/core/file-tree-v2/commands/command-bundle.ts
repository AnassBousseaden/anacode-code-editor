import type { Readable } from 'svelte/store';

import type {
	IDisposable1,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';
import type {
	CommandAvailability,
	CommandDescriptor,
	FileTreeCommandContext,
	InputCommandAvailability
} from '$lib/core/file-tree-v2/commands/command';

export interface IBundledCommand<
	TID extends string,
	TResult,
	TError extends OperationFailure<string>
> extends IDisposable1 {
	readonly descriptor: CommandDescriptor<TID>;
	readonly availability: Readable<CommandAvailability<TError>>;
	readonly commandContext: Readable<FileTreeCommandContext>;
	perform(): Promise<Result<TResult, TError>>;
}

export interface IBundledInputCommand<
	TID extends string,
	TInput,
	TResult,
	TError extends OperationFailure<string>
> extends IDisposable1 {
	readonly descriptor: CommandDescriptor<TID>;
	readonly availability: Readable<InputCommandAvailability<TInput, TError>>;
	readonly commandContext: Readable<FileTreeCommandContext>;
	canPerform(performInput: TInput): Result<void, TError>;
	perform(performInput: TInput): Promise<Result<TResult, TError>>;
}
