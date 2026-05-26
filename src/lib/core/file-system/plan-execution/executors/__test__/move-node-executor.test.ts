import { describe, expect, it } from 'vitest';
import { finishDraft } from 'immer';

import type { OperationError } from '$lib/core/file-system/domain/file-system-models';
import {
	type AtomicEventPayload,
	FileSystemEventType,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type NodeMovedEvent,
	type NodeMovePlan,
	NodeType,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { MoveNodeExecutor } from '$lib/core/file-system/plan-execution/executors/move-node-executor';
import {
	createNestedState,
	createTestContext,
	NODE_A,
	NODE_B,
	type TestContext
} from './test-fixtures';

describe('MoveNodeExecutor', () => {
	it('should move a file and produce NODE_MOVED event', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: MoveNodeExecutor = new MoveNodeExecutor(ctx.eventFactory);

		const plan: NodeMovePlan = {
			type: FileSystemPlanType.NODE_MOVE,
			nodeID: NODE_B,
			oldParentID: NODE_A,
			newParentID: ROOT_NODE_ID
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const event: NodeMovedEvent = result.value[0] as NodeMovedEvent;
		expect(event.type).toBe(FileSystemEventType.NODE_MOVED);
		expect(event.oldParentID).toBe(NODE_A);
		expect(event.newParentID).toBe(ROOT_NODE_ID);
	});

	it('should capture correct before and after paths', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: MoveNodeExecutor = new MoveNodeExecutor(ctx.eventFactory);

		const plan: NodeMovePlan = {
			type: FileSystemPlanType.NODE_MOVE,
			nodeID: NODE_B,
			oldParentID: NODE_A,
			newParentID: ROOT_NODE_ID
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeMovedEvent = result.value[0] as NodeMovedEvent;
		expect(event.before.path).toContain('/src/main.ts');
		expect(event.after.path).toContain('/root/main.ts');
	});

	it('should update draft parentID and parent children', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: MoveNodeExecutor = new MoveNodeExecutor(ctx.eventFactory);

		const plan: NodeMovePlan = {
			type: FileSystemPlanType.NODE_MOVE,
			nodeID: NODE_B,
			oldParentID: NODE_A,
			newParentID: ROOT_NODE_ID
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;

		const movedNode: FileSystemNode = nextState[NODE_B];
		expect(movedNode.parentID).toBe(ROOT_NODE_ID);

		const oldParent: FileSystemNode = nextState[NODE_A];
		if (oldParent.type === NodeType.FOLDER) {
			expect(oldParent.children).not.toContain(NODE_B);
		}

		const newParent: FileSystemNode = nextState[ROOT_NODE_ID];
		if (newParent.type === NodeType.FOLDER) {
			expect(newParent.children).toContain(NODE_B);
		}
	});

	it('should produce events with no proxy references after finishDraft', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: MoveNodeExecutor = new MoveNodeExecutor(ctx.eventFactory);

		const plan: NodeMovePlan = {
			type: FileSystemPlanType.NODE_MOVE,
			nodeID: NODE_B,
			oldParentID: NODE_A,
			newParentID: ROOT_NODE_ID
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		finishDraft(ctx.draft);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		for (const event of result.value) {
			if (event.type === FileSystemEventType.NODE_MOVED) {
				const movedEvent: NodeMovedEvent = event as NodeMovedEvent;
				expect(() => movedEvent.before.name).not.toThrow();
				expect(() => movedEvent.after.name).not.toThrow();
				expect(() => movedEvent.before.permissions.read).not.toThrow();
				expect(() => movedEvent.after.permissions.read).not.toThrow();
			}
		}
	});
});
