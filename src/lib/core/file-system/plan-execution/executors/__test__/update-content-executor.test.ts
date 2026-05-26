import { describe, expect, it } from 'vitest';
import { finishDraft } from 'immer';

import type { OperationError } from '$lib/core/file-system/domain/file-system-models';
import {
	type AtomicEventPayload,
	type FileNode,
	FileSystemEventType,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type FileSystemWriteOrigin,
	type NodeContentUpdatedPlan,
	type NodeID,
	type NodeUpdatedEvent
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { UpdateContentExecutor } from '$lib/core/file-system/plan-execution/executors/update-content-executor';
import {
	createNestedState,
	createTestContext,
	NODE_A,
	NODE_B,
	type TestContext
} from './test-fixtures';

describe('UpdateContentExecutor', () => {
	const TEST_ORIGIN: FileSystemWriteOrigin = 'test-origin' as FileSystemWriteOrigin;

	it('should update file content and produce NODE_CONTENT_UPDATED event', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: NODE_B,
			oldContent: 'main content',
			newContent: 'updated content',
			origin: TEST_ORIGIN
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const event: NodeUpdatedEvent = result.value[0] as NodeUpdatedEvent;
		expect(event.type).toBe(FileSystemEventType.NODE_CONTENT_UPDATED);
		expect(event.before.content).toBe('main content');
		expect(event.after.content).toBe('updated content');
		expect(event.origin).toBe(TEST_ORIGIN);
	});

	it('should capture correct before and after content', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: NODE_B,
			oldContent: 'main content',
			newContent: 'new code',
			origin: TEST_ORIGIN
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeUpdatedEvent = result.value[0] as NodeUpdatedEvent;
		expect(event.before.content).toBe('main content');
		expect(event.after.content).toBe('new code');
	});

	it('should update draft state with new content', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: NODE_B,
			oldContent: 'main content',
			newContent: 'updated',
			origin: TEST_ORIGIN
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;
		const node: FileNode = nextState[NODE_B] as FileNode;

		expect(node.content).toBe('updated');
	});

	it('should return empty events for folder node', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: NODE_A,
			oldContent: '',
			newContent: 'content',
			origin: TEST_ORIGIN
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(0);
	});

	it('should return empty events for nonexistent node', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: 999 as NodeID,
			oldContent: '',
			newContent: 'content',
			origin: TEST_ORIGIN
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(0);
	});

	it('should produce events with no proxy references after finishDraft', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: UpdateContentExecutor = new UpdateContentExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);

		const plan: NodeContentUpdatedPlan = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: NODE_B,
			oldContent: 'main content',
			newContent: 'updated',
			origin: TEST_ORIGIN
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		finishDraft(ctx.draft);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeUpdatedEvent = result.value[0] as NodeUpdatedEvent;
		expect(() => event.before.name).not.toThrow();
		expect(() => event.after.name).not.toThrow();
		expect(() => event.before.permissions.read).not.toThrow();
		expect(() => event.before.content).not.toThrow();
		expect(() => event.after.content).not.toThrow();
	});
});
