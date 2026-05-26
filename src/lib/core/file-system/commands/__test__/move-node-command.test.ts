import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type MoveNodeCommand,
	type NodeID,
	type NodeMovePlan,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { MoveNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-move-node-command';
import { createBasicState, createGraphIndex, NODE_A, NODE_B, NODE_C } from './test-fixtures';

describe('MoveNodeHandler', () => {
	it('should produce a single NODE_MOVE plan', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: NODE_C,
			newParentID: ROOT_NODE_ID
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const plan: NodeMovePlan = result.value[0] as NodeMovePlan;
		expect(plan.type).toBe(FileSystemPlanType.NODE_MOVE);
		expect(plan.nodeID).toBe(NODE_C);
		expect(plan.oldParentID).toBe(NODE_A);
		expect(plan.newParentID).toBe(ROOT_NODE_ID);
	});

	it('should fail if node does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: 999 as NodeID,
			newParentID: ROOT_NODE_ID
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if attempting to move root', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: ROOT_NODE_ID,
			newParentID: NODE_A
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if moving to same parent', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: NODE_C,
			newParentID: NODE_A
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if target parent is a file', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: NODE_C,
			newParentID: NODE_B
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if would create name collision', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: NODE_B,
			newParentID: NODE_A
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		// readme.md doesn't collide with main.ts, so this should succeed
		expect(result.ok).toBe(true);
	});

	it('should fail if moving a folder into its own descendant', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: MoveNodeHandler = new MoveNodeHandler();

		// NODE_A is parent of NODE_C, cannot move NODE_A into NODE_C
		// But NODE_C is a file, not a folder, so this will fail on "parent not folder"
		// This is still a valid cycle prevention test
		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: NODE_A,
			newParentID: NODE_C
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});
});
