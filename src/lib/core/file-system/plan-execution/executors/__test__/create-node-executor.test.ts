import { describe, expect, it } from 'vitest';
import { finishDraft } from 'immer';

import type { OperationError } from '$lib/core/file-system/domain/file-system-models';
import {
	type AtomicEventPayload,
	DEFAULT_PERMISSIONS,
	FileSystemEventType,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type NodeCreatedEvent,
	type NodeCreatePlan,
	type NodeID,
	NodeType,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { CreateNodeExecutor } from '$lib/core/file-system/plan-execution/executors/create-node-executor';
import { createFlatState, createTestContext, type TestContext } from './test-fixtures';

describe('CreateNodeExecutor', () => {
	it('should create a file node and produce NODE_CREATED event', async () => {
		const ctx: TestContext = createTestContext(createFlatState());
		const executor: CreateNodeExecutor = new CreateNodeExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);
		const newNodeID: NodeID = 100 as NodeID;

		const plan: NodeCreatePlan = {
			type: FileSystemPlanType.NODE_CREATE,
			node: {
				id: newNodeID,
				parentID: ROOT_NODE_ID,
				name: 'new-file.ts',
				type: NodeType.FILE,
				content: 'hello',
				permissions: DEFAULT_PERMISSIONS,
				userSpace: null
			}
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const event: AtomicEventPayload = result.value[0];
		expect(event.type).toBe(FileSystemEventType.NODE_CREATED);

		const createdEvent: NodeCreatedEvent = event as NodeCreatedEvent;
		expect(createdEvent.node.name).toBe('new-file.ts');
		expect(createdEvent.node.path).toContain('new-file.ts');
	});

	it('should create a folder node and produce NODE_CREATED event', async () => {
		const ctx: TestContext = createTestContext(createFlatState());
		const executor: CreateNodeExecutor = new CreateNodeExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);
		const newNodeID: NodeID = 100 as NodeID;

		const plan: NodeCreatePlan = {
			type: FileSystemPlanType.NODE_CREATE,
			node: {
				id: newNodeID,
				parentID: ROOT_NODE_ID,
				name: 'new-folder',
				type: NodeType.FOLDER,
				permissions: DEFAULT_PERMISSIONS,
				userSpace: null
			}
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeCreatedEvent = result.value[0] as NodeCreatedEvent;
		expect(event.node.name).toBe('new-folder');
		expect(event.node.type).toBe(NodeType.FOLDER);
	});

	it('should add created node to parent children in draft', async () => {
		const ctx: TestContext = createTestContext(createFlatState());
		const executor: CreateNodeExecutor = new CreateNodeExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);
		const newNodeID: NodeID = 100 as NodeID;

		const plan: NodeCreatePlan = {
			type: FileSystemPlanType.NODE_CREATE,
			node: {
				id: newNodeID,
				parentID: ROOT_NODE_ID,
				name: 'new-file.ts',
				type: NodeType.FILE,
				content: '',
				permissions: DEFAULT_PERMISSIONS,
				userSpace: null
			}
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;
		const root: FileSystemNode = nextState[ROOT_NODE_ID];

		if (root.type === NodeType.FOLDER) {
			expect(root.children).toContain(newNodeID);
		}
	});

	it('should produce event with no proxy references after finishDraft', async () => {
		const ctx: TestContext = createTestContext(createFlatState());
		const executor: CreateNodeExecutor = new CreateNodeExecutor(
			ctx.eventFactory,
			ctx.contentHashService
		);
		const newNodeID: NodeID = 100 as NodeID;

		const plan: NodeCreatePlan = {
			type: FileSystemPlanType.NODE_CREATE,
			node: {
				id: newNodeID,
				parentID: ROOT_NODE_ID,
				name: 'test.ts',
				type: NodeType.FILE,
				content: 'test',
				permissions: DEFAULT_PERMISSIONS,
				userSpace: null
			}
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		finishDraft(ctx.draft);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeCreatedEvent = result.value[0] as NodeCreatedEvent;
		expect(() => event.node.name).not.toThrow();
		expect(() => event.node.permissions.read).not.toThrow();
		expect(event.node.name).toBe('test.ts');
	});
});
