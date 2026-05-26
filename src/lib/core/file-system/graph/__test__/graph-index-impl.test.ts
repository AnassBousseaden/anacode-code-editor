import { describe, expect, it } from 'vitest';
import type { Result } from '$lib/core/shared/models-utils';
import {
	type AtomicPlanPayload,
	DEFAULT_PERMISSIONS,
	EMPTY_CONTENT_HASH,
	type FileNode,
	type FileSystemMap,
	type FileSystemMapReadonly,
	type FileSystemPath,
	FileSystemPlanType,
	type FolderNode,
	type NodeID,
	NodeType,
	type OperationError,
	ROOT_NODE_ID,
	ROOT_PERMISSIONS
} from '$lib/core/file-system/domain/file-system-models';
import type {
	IGraphSnapshot,
	IMutableGraphIndex
} from '$lib/core/file-system/graph/graph-index';
import { GraphIndex } from '$lib/core/file-system/graph/graph-index-impl';

const NODE_A: NodeID = 1 as NodeID;
const NODE_B: NodeID = 2 as NodeID;
const NODE_C: NodeID = 3 as NodeID;
const NODE_NONEXISTENT: NodeID = 999 as NodeID;

function createTestState(): FileSystemMapReadonly {
	const state: FileSystemMap = {};

	const root: FolderNode = {
		id: ROOT_NODE_ID,
		parentID: null,
		name: 'root',
		path: '/root' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_A, NODE_B],
		permissions: ROOT_PERMISSIONS,
		userSpace: null
	};

	const folderA: FolderNode = {
		id: NODE_A,
		parentID: ROOT_NODE_ID,
		name: 'src',
		path: '/root/src' as FileSystemPath,
		type: NodeType.FOLDER,
		children: [NODE_C],
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	const fileB: FileNode = {
		id: NODE_B,
		parentID: ROOT_NODE_ID,
		name: 'readme.md',
		path: '/root/readme.md' as FileSystemPath,
		type: NodeType.FILE,
		content: '',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	const fileC: FileNode = {
		id: NODE_C,
		parentID: NODE_A,
		name: 'main.ts',
		path: '/root/src/main.ts' as FileSystemPath,
		type: NodeType.FILE,
		content: '',
		contentHash: EMPTY_CONTENT_HASH,
		permissions: DEFAULT_PERMISSIONS,
		userSpace: null
	};

	state[ROOT_NODE_ID] = root;
	state[NODE_A] = folderA;
	state[NODE_B] = fileB;
	state[NODE_C] = fileC;

	return state as FileSystemMapReadonly;
}

function createGraphIndex(): IMutableGraphIndex {
	const state: FileSystemMapReadonly = createTestState();
	const result: Result<IMutableGraphIndex, OperationError> = GraphIndex.fromState(state);

	if (!result.ok) {
		throw new Error(`Failed to create graph index: ${result.error.message}`);
	}

	return result.value;
}

describe('GraphIndex', () => {
	describe('snapshot and restore', () => {
		it('should rollback graph state when restoring after a failed apply', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const snapshot: IGraphSnapshot = snapshotResult.value;

			const validCreatePlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_CREATE,
				node: {
					id: 10 as NodeID,
					parentID: ROOT_NODE_ID,
					name: 'new-file.ts',
					type: NodeType.FILE,
					content: '',
					permissions: DEFAULT_PERMISSIONS,
					userSpace: null
				}
			};

			graphIndex.apply([validCreatePlan]);

			const existsAfterApply: boolean = graphIndex.exists(10 as NodeID);
			expect(existsAfterApply).toBe(true);

			graphIndex.restoreSnapshot(snapshot);

			const existsAfterRestore: boolean = graphIndex.exists(10 as NodeID);
			expect(existsAfterRestore).toBe(false);

			const originalNodesExist: boolean =
				graphIndex.exists(ROOT_NODE_ID) &&
				graphIndex.exists(NODE_A) &&
				graphIndex.exists(NODE_B) &&
				graphIndex.exists(NODE_C);

			expect(originalNodesExist).toBe(true);
		});

		it('should preserve graph state when no restore is called', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const createPlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_CREATE,
				node: {
					id: 10 as NodeID,
					parentID: ROOT_NODE_ID,
					name: 'new-file.ts',
					type: NodeType.FILE,
					content: '',
					permissions: DEFAULT_PERMISSIONS,
					userSpace: null
				}
			};

			const result: Result<void, OperationError> = graphIndex.apply([createPlan]);

			expect(result.ok).toBe(true);

			const newNodeExists: boolean = graphIndex.exists(10 as NodeID);
			expect(newNodeExists).toBe(true);
		});

		it('should fully restore ancestor chains after restore', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const snapshot: IGraphSnapshot = snapshotResult.value;

			const movePlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_MOVE,
				nodeID: NODE_C,
				oldParentID: NODE_A,
				newParentID: ROOT_NODE_ID
			};

			graphIndex.apply([movePlan]);

			const chainAfterMove: Result<
				ReadonlyArray<NodeID>,
				OperationError
			> = graphIndex.getAncestorChain(NODE_C);

			expect(chainAfterMove.ok).toBe(true);

			if (chainAfterMove.ok) {
				expect(chainAfterMove.value).toEqual([ROOT_NODE_ID, NODE_C]);
			}

			graphIndex.restoreSnapshot(snapshot);

			const chainAfterRestore: Result<
				ReadonlyArray<NodeID>,
				OperationError
			> = graphIndex.getAncestorChain(NODE_C);

			expect(chainAfterRestore.ok).toBe(true);

			if (chainAfterRestore.ok) {
				const expectedChain: ReadonlyArray<NodeID> = [ROOT_NODE_ID, NODE_A, NODE_C];
				expect(chainAfterRestore.value).toEqual(expectedChain);
			}
		});
	});
});
