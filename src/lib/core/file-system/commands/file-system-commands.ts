import {
	type AtomicPlanPayload,
	CommandType,
	type FileSystemCommand,
	type FileSystemMapReadonly,
	type OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';

export interface ICommandHandler<T extends FileSystemCommand> {
	execute(
		command: T,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError>;
}

export interface ICommandRegistry {
	getHandler(type: CommandType): ICommandHandler<FileSystemCommand> | undefined;
}
