import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type CreateFileCommand,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type NodeCreatePlan,
	type NodeID,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { CreateFileHandler } from '$lib/core/file-system/commands/handlers/file-system-create-file-command';
import {
	createBasicState,
	createGraphIndex,
	createNodeFactory,
	NODE_A,
	NODE_B
} from './test-fixtures';

describe('CreateFileHandler', () => {
	it('should produce a NODE_CREATE plan for a valid file', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: ROOT_NODE_ID,
			name: 'new-file.ts',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);
		expect(result.value[0].type).toBe(FileSystemPlanType.NODE_CREATE);

		const plan: NodeCreatePlan = result.value[0] as NodeCreatePlan;
		expect(plan.node.name).toBe('new-file.ts');
		expect(plan.node.parentID).toBe(ROOT_NODE_ID);
	});

	it('should fail if parent does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: 999 as NodeID,
			name: 'file.ts',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if parent is a file', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: NODE_B,
			name: 'file.ts',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if name collides with existing sibling', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: ROOT_NODE_ID,
			name: 'readme.md',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if name is empty', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: ROOT_NODE_ID,
			name: '',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should create file in subfolder', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFileHandler = new CreateFileHandler(createNodeFactory());

		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: NODE_A,
			name: 'utils.ts',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const plan: NodeCreatePlan = result.value[0] as NodeCreatePlan;
		expect(plan.node.parentID).toBe(NODE_A);
	});
});
