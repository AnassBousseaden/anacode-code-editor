import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type DeleteNodeCommand,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type NodeID,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { DeleteNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-delete-node-command';
import {
	createBasicState,
	createGraphIndex,
	createReadOnlyState,
	NODE_A,
	NODE_B
} from './test-fixtures';

describe('DeleteNodeHandler', () => {
	it('should produce a single NODE_DELETE plan', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: DeleteNodeHandler = new DeleteNodeHandler();

		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: NODE_B
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);
		expect(result.value[0].type).toBe(FileSystemPlanType.NODE_DELETE);
	});

	it('should fail if node does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: DeleteNodeHandler = new DeleteNodeHandler();

		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: 999 as NodeID
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if attempting to delete root', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: DeleteNodeHandler = new DeleteNodeHandler();

		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: ROOT_NODE_ID
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if node has no delete permission', () => {
		const state: FileSystemMapReadonly = createReadOnlyState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: DeleteNodeHandler = new DeleteNodeHandler();

		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: NODE_A
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should produce a single plan even for folder with children', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: DeleteNodeHandler = new DeleteNodeHandler();

		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: NODE_A
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);
	});
});
