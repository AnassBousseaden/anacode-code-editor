import { createDraft, type Draft } from 'immer';

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
	NodeType,
	ROOT_NODE_ID,
	ROOT_PERMISSIONS
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import { FileSystemEventFactory as EventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { Result } from '$lib/core/shared/models-utils';
import { GraphIndex } from '$lib/core/file-system/graph/graph-index-impl';
import { FileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory-impl';
import {
	RandomEventIDGenerator,
	SystemTimestampProvider
} from '$lib/core/file-system/loader/generators';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import { ContentHashService } from '$lib/core/file-system/hashing/content-hash';

export const NODE_A: NodeID = 1 as NodeID;
export const NODE_B: NodeID = 2 as NodeID;
export const NODE_C: NodeID = 3 as NodeID;
export const NODE_D: NodeID = 4 as NodeID;

export function createFlatState(): FileSystemMapReadonly {
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
		name: 'file-a.ts',
		path: '/root/file-a.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'content-a',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_B] = {
		id: NODE_B,
		parentID: ROOT_NODE_ID,
		name: 'file-b.ts',
		path: '/root/file-b.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'content-b',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	return state as FileSystemMapReadonly;
}

export function createNestedState(): FileSystemMapReadonly {
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
		name: 'src',
		path: '/root/src' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_B, NODE_C] as NodeID[],
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_B] = {
		id: NODE_B,
		parentID: NODE_A,
		name: 'main.ts',
		path: '/root/src/main.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'main content',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_C] = {
		id: NODE_C,
		parentID: NODE_A,
		name: 'utils.ts',
		path: '/root/src/utils.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: 'utils content',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	return state as FileSystemMapReadonly;
}

export function createDeepNestedState(): FileSystemMapReadonly {
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
		name: 'src',
		path: '/root/src' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_B] as NodeID[],
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_B] = {
		id: NODE_B,
		parentID: NODE_A,
		name: 'components',
		path: '/root/src/components' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_C] as NodeID[],
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[NODE_C] = {
		id: NODE_C,
		parentID: NODE_B,
		name: 'Button.svelte',
		path: '/root/src/components/Button.svelte' as FileSystemPath,
		type: NodeType.FILE,
		content: '<button />',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	return state as FileSystemMapReadonly;
}

export interface TestContext {
	readonly state: FileSystemMapReadonly;
	readonly draft: Draft<FileSystemMap>;
	readonly graph: IMutableGraphIndex;
	readonly pathFactory: IFileSystemPathFactory;
	readonly eventFactory: FileSystemEventFactory;
	readonly contentHashService: IContentHashService;
}

export function createTestContext(state: FileSystemMapReadonly): TestContext {
	const graphResult: Result<IMutableGraphIndex, OperationError> = GraphIndex.fromState(state);

	if (!graphResult.ok) {
		throw new Error(`Failed to create graph index: ${graphResult.error.message}`);
	}

	const graph: IMutableGraphIndex = graphResult.value;
	const pathFactory: IFileSystemPathFactory = new FileSystemPathFactory();
	const eventFactory: FileSystemEventFactory = new EventFactory(
		new RandomEventIDGenerator(),
		new SystemTimestampProvider()
	);
	const draft: Draft<FileSystemMap> = createDraft(state as FileSystemMap);
	const contentHashService: IContentHashService = new ContentHashService();

	return {
		state: state,
		draft: draft,
		graph: graph,
		pathFactory: pathFactory,
		eventFactory: eventFactory,
		contentHashService: contentHashService
	};
}
