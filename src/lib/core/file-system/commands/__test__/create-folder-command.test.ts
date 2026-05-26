import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type CreateFolderCommand,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type NodeCreatePlan,
	type NodeID,
	NodeType,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { CreateFolderHandler } from '$lib/core/file-system/commands/handlers/file-system-create-folder-command';
import { createBasicState, createGraphIndex, createNodeFactory } from './test-fixtures';

describe('CreateFolderHandler', () => {
	it('should produce a NODE_CREATE plan for a valid folder', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFolderHandler = new CreateFolderHandler(createNodeFactory());

		const command: CreateFolderCommand = {
			type: CommandType.CREATE_FOLDER,
			parentID: ROOT_NODE_ID,
			name: 'lib',
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

		const plan: NodeCreatePlan = result.value[0] as NodeCreatePlan;
		expect(plan.type).toBe(FileSystemPlanType.NODE_CREATE);
		expect(plan.node.name).toBe('lib');
		expect(plan.node.type).toBe(NodeType.FOLDER);
	});

	it('should fail if parent does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: CreateFolderHandler = new CreateFolderHandler(createNodeFactory());

		const command: CreateFolderCommand = {
			type: CommandType.CREATE_FOLDER,
			parentID: 999 as NodeID,
			name: 'lib',
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
		const handler: CreateFolderHandler = new CreateFolderHandler(createNodeFactory());

		const command: CreateFolderCommand = {
			type: CommandType.CREATE_FOLDER,
			parentID: ROOT_NODE_ID,
			name: 'src',
			userSpace: null
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});
});
