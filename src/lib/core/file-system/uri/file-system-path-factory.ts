import type {
	FileSystemNode,
	FileSystemPath,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';

export interface FileSystemNodeLookup {
	readonly [key: NodeID]: FileSystemNode | undefined;
}

export interface IFileSystemPathFactory {
	buildPath(
		nodeID: NodeID,
		state: FileSystemNodeLookup,
		graph: IGraphIndex
	): Result<FileSystemPath, OperationError>;
}
