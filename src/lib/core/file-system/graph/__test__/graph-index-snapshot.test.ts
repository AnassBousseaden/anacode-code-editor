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

describe('GraphIndex snapshot', () => {
	describe('exportSnapshot', () => {
		it('should return a successful snapshot result', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const result: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(result.ok).toBe(true);
		});

		it('should capture the current graph state', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			expect(snapshotResult.value.data).toBeDefined();
		});
	});

	describe('restoreSnapshot', () => {
		it('should restore node existence after create and rollback', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const newNodeID: NodeID = 10 as NodeID;

			const createPlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_CREATE,
				node: {
					id: newNodeID,
					parentID: ROOT_NODE_ID,
					name: 'new-file.ts',
					type: NodeType.FILE,
					content: '',
					permissions: DEFAULT_PERMISSIONS,
					userSpace: null
				}
			};

			graphIndex.apply([createPlan]);
			expect(graphIndex.exists(newNodeID)).toBe(true);

			graphIndex.restoreSnapshot(snapshotResult.value);
			expect(graphIndex.exists(newNodeID)).toBe(false);
		});

		it('should restore node existence after delete and rollback', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const deletePlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_DELETE,
				nodeID: NODE_C
			};

			graphIndex.apply([deletePlan]);
			expect(graphIndex.exists(NODE_C)).toBe(false);

			graphIndex.restoreSnapshot(snapshotResult.value);
			expect(graphIndex.exists(NODE_C)).toBe(true);
		});

		it('should restore ancestor chains after move and rollback', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const originalChainResult: Result<
				ReadonlyArray<NodeID>,
				OperationError
			> = graphIndex.getAncestorChain(NODE_C);

			expect(originalChainResult.ok).toBe(true);

			if (!originalChainResult.ok) {
				return;
			}

			const originalChain: ReadonlyArray<NodeID> = originalChainResult.value;

			const movePlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_MOVE,
				nodeID: NODE_C,
				oldParentID: NODE_A,
				newParentID: ROOT_NODE_ID
			};

			graphIndex.apply([movePlan]);

			const movedChainResult: Result<
				ReadonlyArray<NodeID>,
				OperationError
			> = graphIndex.getAncestorChain(NODE_C);

			expect(movedChainResult.ok).toBe(true);

			if (movedChainResult.ok) {
				expect(movedChainResult.value).toEqual([ROOT_NODE_ID, NODE_C]);
			}

			graphIndex.restoreSnapshot(snapshotResult.value);

			const restoredChainResult: Result<
				ReadonlyArray<NodeID>,
				OperationError
			> = graphIndex.getAncestorChain(NODE_C);

			expect(restoredChainResult.ok).toBe(true);

			if (restoredChainResult.ok) {
				expect(restoredChainResult.value).toEqual(originalChain);
			}
		});

		it('should restore subtree structure after delete and rollback', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshotResult: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshotResult.ok).toBe(true);

			if (!snapshotResult.ok) {
				return;
			}

			const originalSubtree: ReadonlyArray<NodeID> = graphIndex.getSubtree(NODE_A);

			const deletePlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_DELETE,
				nodeID: NODE_C
			};

			graphIndex.apply([deletePlan]);

			const reducedSubtree: ReadonlyArray<NodeID> = graphIndex.getSubtree(NODE_A);
			expect(reducedSubtree).not.toEqual(originalSubtree);

			graphIndex.restoreSnapshot(snapshotResult.value);

			const restoredSubtree: ReadonlyArray<NodeID> = graphIndex.getSubtree(NODE_A);
			expect(restoredSubtree).toEqual(originalSubtree);
		});

		it('should allow multiple snapshots independently', () => {
			const graphIndex: IMutableGraphIndex = createGraphIndex();

			const snapshot1Result: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshot1Result.ok).toBe(true);

			if (!snapshot1Result.ok) {
				return;
			}

			const createPlan: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_CREATE,
				node: {
					id: 10 as NodeID,
					parentID: ROOT_NODE_ID,
					name: 'file1.ts',
					type: NodeType.FILE,
					content: '',
					permissions: DEFAULT_PERMISSIONS,
					userSpace: null
				}
			};

			graphIndex.apply([createPlan]);

			const snapshot2Result: Result<IGraphSnapshot, OperationError> = graphIndex.exportSnapshot();

			expect(snapshot2Result.ok).toBe(true);

			if (!snapshot2Result.ok) {
				return;
			}

			const createPlan2: AtomicPlanPayload = {
				type: FileSystemPlanType.NODE_CREATE,
				node: {
					id: 20 as NodeID,
					parentID: ROOT_NODE_ID,
					name: 'file2.ts',
					type: NodeType.FILE,
					content: '',
					permissions: DEFAULT_PERMISSIONS,
					userSpace: null
				}
			};

			graphIndex.apply([createPlan2]);

			expect(graphIndex.exists(10 as NodeID)).toBe(true);
			expect(graphIndex.exists(20 as NodeID)).toBe(true);

			graphIndex.restoreSnapshot(snapshot2Result.value);

			expect(graphIndex.exists(10 as NodeID)).toBe(true);
			expect(graphIndex.exists(20 as NodeID)).toBe(false);

			graphIndex.restoreSnapshot(snapshot1Result.value);

			expect(graphIndex.exists(10 as NodeID)).toBe(false);
			expect(graphIndex.exists(20 as NodeID)).toBe(false);
		});
	});
});
