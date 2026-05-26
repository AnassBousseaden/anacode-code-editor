import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type FileSystemWriteOrigin,
	type NodeContentUpdatedPlan,
	type NodeID,
	type OperationError,
	type UpdateContentCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { UpdateContentHandler } from '$lib/core/file-system/commands/handlers/file-system-update-content-command';
import {
	createBasicState,
	createGraphIndex,
	createReadOnlyState,
	NODE_A,
	NODE_B
} from './test-fixtures';

describe('UpdateContentHandler', () => {
	const TEST_ORIGIN: FileSystemWriteOrigin = 'test-origin' as FileSystemWriteOrigin;

	it('should produce a single NODE_CONTENT_UPDATED plan', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentHandler = new UpdateContentHandler();

		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: NODE_B,
			newContent: 'updated',
			origin: TEST_ORIGIN
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const plan: NodeContentUpdatedPlan = result.value[0] as NodeContentUpdatedPlan;
		expect(plan.type).toBe(FileSystemPlanType.NODE_CONTENT_UPDATED);
		expect(plan.oldContent).toBe('hello');
		expect(plan.newContent).toBe('updated');
		expect(plan.origin).toBe(TEST_ORIGIN);
	});

	it('should fail if node does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentHandler = new UpdateContentHandler();

		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: 999 as NodeID,
			newContent: 'content',
			origin: TEST_ORIGIN
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if node is a folder', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentHandler = new UpdateContentHandler();

		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: NODE_A,
			newContent: 'content',
			origin: TEST_ORIGIN
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should fail if node has no write permission', () => {
		const state: FileSystemMapReadonly = createReadOnlyState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentHandler = new UpdateContentHandler();

		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: NODE_A,
			newContent: 'content',
			origin: TEST_ORIGIN
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should capture old content in plan', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentHandler = new UpdateContentHandler();

		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: NODE_B,
			newContent: 'new',
			origin: TEST_ORIGIN
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const plan: NodeContentUpdatedPlan = result.value[0] as NodeContentUpdatedPlan;
		expect(plan.oldContent).toBe('hello');
	});
});
