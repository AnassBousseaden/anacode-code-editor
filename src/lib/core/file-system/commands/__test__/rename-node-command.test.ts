import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type NodeID,
	type NodeRenamePlan,
	type OperationError,
	type RenameNodeCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { RenameNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-rename-node-command';
import {
	createBasicState,
	createGraphIndex,
	createReadOnlyState,
	NODE_A,
	NODE_B
} from './test-fixtures';

describe('RenameNodeHandler', () => {
	it('should produce a single NODE_RENAME plan', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_B,
			newName: 'README.md'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const plan: NodeRenamePlan = result.value[0] as NodeRenamePlan;
		expect(plan.type).toBe(FileSystemPlanType.NODE_RENAME);
		expect(plan.oldName).toBe('readme.md');
		expect(plan.newName).toBe('README.md');
	});

	it('should return empty plans for same name', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_B,
			newName: 'readme.md'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(0);
	});

	it('should fail if node does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: 999 as NodeID,
			newName: 'new-name'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if name collides with sibling', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_A,
			newName: 'readme.md'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if node has no rename permission', () => {
		const state: FileSystemMapReadonly = createReadOnlyState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_A,
			newName: 'new-name.ts'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if new name is empty', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_B,
			newName: ''
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should rename a folder', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: RenameNodeHandler = new RenameNodeHandler();

		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: NODE_A,
			newName: 'lib'
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const plan: NodeRenamePlan = result.value[0] as NodeRenamePlan;
		expect(plan.oldName).toBe('src');
		expect(plan.newName).toBe('lib');
	});
});
