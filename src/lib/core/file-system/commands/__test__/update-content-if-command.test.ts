import { describe, expect, it } from 'vitest';

import {
	type AtomicPlanPayload,
	CommandType,
	type ContentHash,
	EMPTY_CONTENT_HASH,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type FileSystemWriteOrigin,
	type NodeContentUpdatedPlan,
	type NodeID,
	type OperationError,
	type UpdateContentIfCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import { UpdateContentIfHandler } from '$lib/core/file-system/commands/handlers/file-system-update-content-if-command';
import {
	createBasicState,
	createGraphIndex,
	createReadOnlyState,
	NODE_A,
	NODE_B
} from './test-fixtures';

describe('UpdateContentIfHandler', () => {
	const TEST_ORIGIN: FileSystemWriteOrigin = 'test-origin' as FileSystemWriteOrigin;
	const MISMATCHED_HASH: ContentHash = 'deadbeef' as ContentHash;

	it('should produce a single NODE_CONTENT_UPDATED plan when hash matches', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: NODE_B,
			newContent: 'updated',
			origin: TEST_ORIGIN,
			targetHash: EMPTY_CONTENT_HASH
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

	it('should fail when target hash does not match current hash', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: NODE_B,
			newContent: 'updated',
			origin: TEST_ORIGIN,
			targetHash: MISMATCHED_HASH
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);

		if (result.ok) return;

		expect(result.error.message).toContain('hash mismatch');
	});

	it('should fail if node does not exist', () => {
		const state: FileSystemMapReadonly = createBasicState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: 999 as NodeID,
			newContent: 'content',
			origin: TEST_ORIGIN,
			targetHash: EMPTY_CONTENT_HASH
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
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: NODE_A,
			newContent: 'content',
			origin: TEST_ORIGIN,
			targetHash: EMPTY_CONTENT_HASH
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
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: NODE_A,
			newContent: 'content',
			origin: TEST_ORIGIN,
			targetHash: EMPTY_CONTENT_HASH
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);
	});

	it('should check permission before hash', () => {
		const state: FileSystemMapReadonly = createReadOnlyState();
		const graph: IGraphIndex = createGraphIndex(state);
		const handler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: NODE_A,
			newContent: 'content',
			origin: TEST_ORIGIN,
			targetHash: MISMATCHED_HASH
		};

		const result: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			state,
			graph
		);

		expect(result.ok).toBe(false);

		if (result.ok) return;

		expect(result.error.message).toContain('Permission denied');
	});
});
