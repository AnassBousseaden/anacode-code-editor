import { describe, expect, it } from 'vitest';
import { finishDraft } from 'immer';

import type { OperationError } from '$lib/core/file-system/domain/file-system-models';
import {
	type AtomicEventPayload,
	FileSystemEventType,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type NodeID,
	type NodePathChangedEvent,
	type NodeRenamedEvent,
	type NodeRenamePlan
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { RenameNodeExecutor } from '$lib/core/file-system/plan-execution/executors/rename-node-executor';
import {
	createDeepNestedState,
	createNestedState,
	createTestContext,
	NODE_A,
	NODE_B,
	NODE_C,
	type TestContext
} from './test-fixtures';

describe('RenameNodeExecutor', () => {
	it('should rename a file and produce NODE_RENAMED event', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_B,
			oldName: 'main.ts',
			newName: 'index.ts'
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.value.length).toBe(1);

		const event: NodeRenamedEvent = result.value[0] as NodeRenamedEvent;
		expect(event.type).toBe(FileSystemEventType.NODE_RENAMED);
		expect(event.oldName).toBe('main.ts');
		expect(event.newName).toBe('index.ts');
	});

	it('should capture correct before and after snapshots', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_B,
			oldName: 'main.ts',
			newName: 'index.ts'
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const event: NodeRenamedEvent = result.value[0] as NodeRenamedEvent;
		expect(event.before.name).toBe('main.ts');
		expect(event.after.name).toBe('index.ts');
		expect(event.before.path).toContain('main.ts');
		expect(event.after.path).toContain('index.ts');
	});

	it('should rename a folder and emit NODE_PATH_CHANGED for all descendants', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_A,
			oldName: 'src',
			newName: 'lib'
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const renamedEvents: AtomicEventPayload[] = result.value.filter(
			(event: AtomicEventPayload): boolean => event.type === FileSystemEventType.NODE_RENAMED
		);
		const pathChangedEvents: AtomicEventPayload[] = result.value.filter(
			(event: AtomicEventPayload): boolean => event.type === FileSystemEventType.NODE_PATH_CHANGED
		);

		expect(renamedEvents.length).toBe(1);
		expect(pathChangedEvents.length).toBe(2);

		for (const event of pathChangedEvents) {
			const pathEvent: NodePathChangedEvent = event as NodePathChangedEvent;
			expect(pathEvent.oldPath).toContain('/src/');
			expect(pathEvent.newPath).toContain('/lib/');
		}
	});

	it('should update paths on deeply nested descendants', async () => {
		const ctx: TestContext = createTestContext(createDeepNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_A,
			oldName: 'src',
			newName: 'lib'
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		const pathChangedEvents: NodePathChangedEvent[] = result.value.filter(
			(event: AtomicEventPayload): boolean => event.type === FileSystemEventType.NODE_PATH_CHANGED
		) as NodePathChangedEvent[];

		const buttonEvent: NodePathChangedEvent | undefined = pathChangedEvents.find(
			(event: NodePathChangedEvent): boolean => event.nodeID === NODE_C
		);

		expect(buttonEvent).toBeDefined();

		if (buttonEvent !== undefined) {
			expect(buttonEvent.oldPath).toContain('/src/components/Button.svelte');
			expect(buttonEvent.newPath).toContain('/lib/components/Button.svelte');
		}
	});

	it('should update the draft state with new name and paths', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_A,
			oldName: 'src',
			newName: 'lib'
		};

		await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		const nextState: FileSystemMapReadonly = finishDraft(ctx.draft) as FileSystemMapReadonly;

		const renamedNode: FileSystemNode = nextState[NODE_A];
		expect(renamedNode.name).toBe('lib');
		expect(renamedNode.path).toContain('/lib');

		const childNode: FileSystemNode = nextState[NODE_B];
		expect(childNode.path).toContain('/lib/');
	});

	it('should return empty events for nonexistent node', async () => {
		const ctx: TestContext = createTestContext(createNestedState());
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: 999 as NodeID,
			oldName: 'old',
			newName: 'new'
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
		const executor: RenameNodeExecutor = new RenameNodeExecutor(ctx.eventFactory);

		const plan: NodeRenamePlan = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: NODE_A,
			oldName: 'src',
			newName: 'lib'
		};

		const result: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await executor.execute(ctx.draft, plan, ctx.graph, ctx.pathFactory);

		finishDraft(ctx.draft);

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		for (const event of result.value) {
			if (event.type === FileSystemEventType.NODE_RENAMED) {
				const renamedEvent: NodeRenamedEvent = event as NodeRenamedEvent;
				expect(() => renamedEvent.before.name).not.toThrow();
				expect(() => renamedEvent.after.name).not.toThrow();
				expect(() => renamedEvent.before.permissions.read).not.toThrow();
				expect(() => renamedEvent.after.permissions.read).not.toThrow();
			}

			if (event.type === FileSystemEventType.NODE_PATH_CHANGED) {
				const pathEvent: NodePathChangedEvent = event as NodePathChangedEvent;
				expect(() => pathEvent.before.name).not.toThrow();
				expect(() => pathEvent.after.name).not.toThrow();
				expect(() => pathEvent.before.permissions.read).not.toThrow();
			}
		}
	});
});
