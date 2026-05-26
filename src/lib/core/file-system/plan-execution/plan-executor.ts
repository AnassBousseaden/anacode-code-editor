import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	AtomicPlanPayload,
	FileSystemMap,
	FileSystemPlanType,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { Result } from '$lib/core/shared/models-utils';

export interface IPlanExecutor<T extends AtomicPlanPayload> {
	execute(
		draft: Draft<FileSystemMap>,
		plan: T,
		graph: IMutableGraphIndex,
		pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>>;
}

export interface IPlanExecutorRegistry {
	getExecutor(type: FileSystemPlanType): IPlanExecutor<AtomicPlanPayload> | undefined;
}
