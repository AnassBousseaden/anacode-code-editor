import type {
	FileSystemNode,
	FileSystemPath,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import type {
	FileSystemNodeLookup,
	IFileSystemPathFactory
} from '$lib/core/file-system/uri/file-system-path-factory';

const PathFactoryErrorMessages = {
	NODE_NOT_IN_STATE: (nodeID: NodeID): string => `Node ${nodeID} exists in graph but not in state`
} as const;

export class FileSystemPathFactory implements IFileSystemPathFactory {
	buildPath(
		nodeID: NodeID,
		state: FileSystemNodeLookup,
		graph: IGraphIndex
	): Result<FileSystemPath, OperationError> {
		const chainResult: Result<ReadonlyArray<NodeID>, OperationError> = graph.getAncestorChain(
			nodeID
		);

		if (!chainResult.ok) {
			return chainResult;
		}

		const chain: ReadonlyArray<NodeID> = chainResult.value;
		const segments: string[] = [];

		for (const ancestorID of chain) {
			const node: FileSystemNode | undefined = state[ancestorID];

			if (node === undefined) {
				const error: OperationError = {
					message: PathFactoryErrorMessages.NODE_NOT_IN_STATE(ancestorID)
				};
				return { ok: false, error: error };
			}

			segments.push(node.name);
		}

		const absolutePath: string = '/' + segments.join('/');

		return { ok: true, value: absolutePath as FileSystemPath };
	}
}
