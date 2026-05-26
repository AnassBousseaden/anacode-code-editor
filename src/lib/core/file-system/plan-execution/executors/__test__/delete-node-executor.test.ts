import { describe, expect, it } from 'vitest';
import { finishDraft } from 'immer';

import type { OperationError } from '$lib/core/file-system/domain/file-system-models';
import {
	type AtomicEventPayload,
	FileSystemEventType,
	type FileSystemMapReadonly,
	FileSystemPlanType,
	type NodeDeletedEvent,
	type NodeDeletePlan,
	type NodeID,
	NodeType,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { DeleteNodeExecutor } from '$lib/core/file-system/plan-execution/executors/delete-node-executor';
import {
	createNestedState,
	createTestContext,
	NODE_A,
	NODE_B,
	NODE_C,
	type TestContext
} from './test-fixtures';

describe('DeleteNodeExecutor', () => {
	it('should delete a single file and produce NODE_DELETED event', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: DeleteNodeExecutor = new DeleteNodeExecutor(ctx.eventFactory);

		const plan: NodeDeletePlan = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: NODE_B
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const event: NodeDeletedEvent = result.value[0] as NodeDeletedEvent;
		expect(event.type).toBe(FileSystemEventType.NODE_DELETED);
		expect(event.node.name).toBe('main.ts');
	});

	it('should delete a folder and all descendants', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: DeleteNodeExecutor = new DeleteNodeExecutor(ctx.eventFactory);

		const plan: NodeDeletePlan = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: NODE_A
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(3);

		const deletedNodeIDs: NodeID[] = result.value.map(
			(event: AtomicEventPayload): NodeID => event.nodeID
		);

		expect(deletedNodeIDs).toContain(NODE_A);
		expect(deletedNodeIDs).toContain(NODE_B);
		expect(deletedNodeIDs).toContain(NODE_C);
	});

	it('should remove deleted nodes from draft', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: DeleteNodeExecutor = new DeleteNodeExecutor(ctx.eventFactory);

		const plan: NodeDeletePlan = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: NODE_A
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;

		expect(nextState[NODE_A]).toBeUndefined();
		expect(nextState[NODE_B]).toBeUndefined();
		expect(nextState[NODE_C]).toBeUndefined();
		expect(nextState[ROOT_NODE_ID]).toBeDefined();
	});

	it('should remove deleted node from parent children', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: DeleteNodeExecutor = new DeleteNodeExecutor(ctx.eventFactory);

		const plan: NodeDeletePlan = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: NODE_A
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;
		const root = nextState[ROOT_NODE_ID];

		if (root.type === NodeType.FOLDER) {
			expect(root.children).not.toContain(NODE_A);
		}
	});

	it('should produce events with no proxy references after finishDraft', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: DeleteNodeExecutor = new DeleteNodeExecutor(ctx.eventFactory);

		const plan: NodeDeletePlan = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: NODE_A
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		finishDraft(ctx.draft);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		for (const event of result.value) {
			const deletedEvent: NodeDeletedEvent = event as NodeDeletedEvent;
			expect(() => deletedEvent.node.name).not.toThrow();
			expect(() => deletedEvent.node.permissions.read).not.toThrow();
		}
	});
});
