import type {
	FileSystemMap,
	FileSystemMapReadonly,
	FileSystemPath,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import {
	DEFAULT_PERMISSIONS,
	EMPTY_CONTENT_HASH,
	LOCKED_PERMISSIONS,
	NodeType,
	ROOT_NODE_ID,
	ROOT_PERMISSIONS
} from '$lib/core/file-system/domain/file-system-models';
import type {
	IGraphIndex,
	IMutableGraphIndex
} from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { GraphIndex } from '$lib/core/file-system/graph/graph-index-impl';
import { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';
import { RandomNodeIDGenerator } from '$lib/core/file-system/loader/generators';

export const NODE_A: NodeID = 1 as NodeID;
export const NODE_B: NodeID = 2 as NodeID;
export const NODE_C: NodeID = 3 as NodeID;

export function createNodeFactory(): NodeFactory {
	return new NodeFactory(new RandomNodeIDGenerator());
}

export function createBasicState(): FileSystemMapReadonly {
	const state: FileSystemMap = {};

	state[ROOT_NODE_ID] = {
		id: ROOT_NODE_ID,
		parentID: null,
		name: 'root',
		path: '/root' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_A, NODE_B] as NodeID[],
		permissions: ROOT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_A] = {
		id: NODE_A,
		parentID: ROOT_NODE_ID,
		name: 'src',
		path: '/root/src' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_C] as NodeID[],
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_B] = {
		id: NODE_B,
		parentID: ROOT_NODE_ID,
		name: 'readme.md',
		path: '/root/readme.md' as FileSystemPath,
		type: NodeType.FILE,
		content: 'hello',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_C] = {
		id: NODE_C,
		parentID: NODE_A,
		name: 'main.ts',
		path: '/root/src/main.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'main',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	return state as FileSystemMapReadonly;
}

export function createReadOnlyState(): FileSystemMapReadonly {
	const state: FileSystemMap = {};

	state[ROOT_NODE_ID] = {
		id: ROOT_NODE_ID,
		parentID: null,
		name: 'root',
		path: '/root' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_A] as NodeID[],
		permissions: ROOT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_A] = {
		id: NODE_A,
		parentID: ROOT_NODE_ID,
		name: 'locked.ts',
		path: '/root/locked.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'locked',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: LOCKED_PERMISSIONS,
		userSpace: null
	};

	return state as FileSystemMapReadonly;
}

export function createGraphIndex(state: FileSystemMapReadonly): IGraphIndex {
	const result: Result<IMutableGraphIndex, OperationError> = GraphIndex.fromState(state);

	if (!result.ok) {
		throw new Error(`Failed to create graph index: ${result.error.message}`);
	}

	return result.value;
}
