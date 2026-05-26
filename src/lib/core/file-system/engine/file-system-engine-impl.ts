import { createDraft, type Draft, finishDraft } from 'immer';
import type { Unsubscriber } from 'svelte/store';
import type { Result, TransactionListener } from '$lib/core/shared/models-utils';
import { failure } from '$lib/core/shared/models-utils';
import {
	type AtomicEventPayload,
	type AtomicPlanPayload,
	type FileSystemCommand,
	type FileSystemEvent,
	type FileSystemMap,
	type FileSystemMapReadonly,
	type FileSystemPlan,
	type IFileSystemEngine,
	type OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type {
	IGraphSnapshot,
	IMutableGraphIndex
} from '$lib/core/file-system/graph/graph-index';
import type {
	ICommandHandler,
	ICommandRegistry
} from '$lib/core/file-system/commands/file-system-commands';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type {
	IPlanExecutor,
	IPlanExecutorRegistry
} from '$lib/core/file-system/plan-execution/plan-executor';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';

const EngineErrorMessages = {
	UNKNOWN_COMMAND_TYPE: (type: string): string => `Unknown command type: ${type}`,
	UNKNOWN_PLAN_TYPE: (type: string): string => `No executor found for plan type: ${type}`
} as const;

type ExecuteResolver = (result: Result<FileSystemEvent, OperationError>) => void;

export class FileSystemEngine implements IFileSystemEngine {
	private currentState: FileSystemMapReadonly;
	private readonly graphIndex: IMutableGraphIndex;
	private readonly commandRegistry: ICommandRegistry;
	private readonly planExecutorRegistry: IPlanExecutorRegistry;
	private readonly eventFactory: FileSystemEventFactory;
	private readonly pathFactory: IFileSystemPathFactory;
	private readonly listeners: Set<TransactionListener<FileSystemEvent>>;
	private executionQueue: Promise<void>;

	public constructor(
		initialState: FileSystemMapReadonly,
		mutableGraphIndex: IMutableGraphIndex,
		commandRegistry: ICommandRegistry,
		planExecutorRegistry: IPlanExecutorRegistry,
		eventFactory: FileSystemEventFactory,
		pathFactory: IFileSystemPathFactory
	) {
		this.currentState = initialState;
		this.graphIndex = mutableGraphIndex;
		this.commandRegistry = commandRegistry;
		this.planExecutorRegistry = planExecutorRegistry;
		this.eventFactory = eventFactory;
		this.pathFactory = pathFactory;

		this.listeners = new Set<TransactionListener<FileSystemEvent>>();
		this.executionQueue = Promise.resolve();
	}

	public get state(): FileSystemMapReadonly {
		return this.currentState;
	}

	public onTransaction(listener: TransactionListener<FileSystemEvent>): Unsubscriber {
		this.listeners.add(listener);

		const unsubscribe: Unsubscriber = (): void => {
			this.listeners.delete(listener);
		};

		return unsubscribe;
	}

	public canExecute(command: FileSystemCommand): Result<FileSystemPlan, OperationError> {
		const commandType: string = command.type;
		const handler: ICommandHandler<FileSystemCommand> | undefined = this.commandRegistry.getHandler(
			command.type
		);

		if (handler === undefined) {
			return invalid(EngineErrorMessages.UNKNOWN_COMMAND_TYPE(commandType));
		}

		const currentState: FileSystemMapReadonly = this.currentState;
		const planResult: Result<AtomicPlanPayload[], OperationError> = handler.execute(
			command,
			currentState,
			this.graphIndex
		);

		if (!planResult.ok) {
			return planResult;
		}

		const description: string = this.generateDescription(command);
		const plan: FileSystemPlan = {
			description: description,
			changes: planResult.value
		};

		return valid(plan);
	}

	public execute(command: FileSystemCommand): Promise<Result<FileSystemEvent, OperationError>> {
		const executor: (resolve: ExecuteResolver) => void = this.createExecutor(command);

		const resultPromise: Promise<Result<FileSystemEvent, OperationError>> = new Promise<
			Result<FileSystemEvent, OperationError>
		>(executor);

		return resultPromise;
	}

	private createExecutor(
		fileSystemCommand: FileSystemCommand
	): (executeResolver: ExecuteResolver) => void {
		return (executeResolver: ExecuteResolver): void => {
			const processTask: () => Promise<void> = this.createProcessTask(
				fileSystemCommand,
				executeResolver
			);

			const errorHandler: (error: unknown) => void = this.createErrorHandler(executeResolver);

			this.executionQueue = this.executionQueue.then(processTask).catch(errorHandler);
		};
	}

	private createProcessTask(
		command: FileSystemCommand,
		resolve: ExecuteResolver
	): () => Promise<void> {
		return async (): Promise<void> => {
			const result: Result<FileSystemEvent, OperationError> = await this.processCommand(command);
			resolve(result);
		};
	}

	private createErrorHandler(resolve: ExecuteResolver): (error: unknown) => void {
		return (error: unknown): void => {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown engine error';
			const engineError: Result<FileSystemEvent, OperationError> = invalid(errorMessage);
			resolve(engineError);
		};
	}

	private async processCommand(
		command: FileSystemCommand
	): Promise<Result<FileSystemEvent, OperationError>> {
		const planResult: Result<FileSystemPlan, OperationError> = this.canExecute(command);

		if (!planResult.ok) {
			return planResult;
		}

		const plan: FileSystemPlan = planResult.value;
		const commitResult: Result<
			ReadonlyArray<AtomicEventPayload>,
			OperationError
		> = await this.commit(plan);

		if (!commitResult.ok) {
			return commitResult;
		}

		const resolvedEvents: ReadonlyArray<AtomicEventPayload> = commitResult.value;
		const event: FileSystemEvent = this.eventFactory.createEvent(plan, resolvedEvents);

		this.notifyListeners(event);

		return valid(event);
	}

	private async commit(
		plan: FileSystemPlan
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const previousState: FileSystemMapReadonly = this.currentState;
		const plans: ReadonlyArray<AtomicPlanPayload> = plan.changes;

		const snapshotResult: Result<IGraphSnapshot, OperationError> = this.graphIndex.exportSnapshot();

		if (!snapshotResult.ok) {
			return failure(snapshotResult.error);
		}

		const graphSnapshot: IGraphSnapshot = snapshotResult.value;
		const allEvents: AtomicEventPayload[] = [];
		const draft: Draft<FileSystemMap> = createDraft(previousState as FileSystemMap);

		for (const atomicPlan of plans) {
			const executor: IPlanExecutor<AtomicPlanPayload> | undefined =
				this.planExecutorRegistry.getExecutor(atomicPlan.type);

			if (executor === undefined) {
				this.graphIndex.restoreSnapshot(graphSnapshot);
				return failure({ message: EngineErrorMessages.UNKNOWN_PLAN_TYPE(atomicPlan.type) });
			}

			const result: Result<
				ReadonlyArray<AtomicEventPayload>,
				OperationError
			> = await executor.execute(draft, atomicPlan, this.graphIndex, this.pathFactory);

			if (!result.ok) {
				this.graphIndex.restoreSnapshot(graphSnapshot);
				return failure(result.error);
			}

			allEvents.push(...result.value);
		}

		const nextState: FileSystemMapReadonly = finishDraft(draft) as FileSystemMapReadonly;
		this.currentState = nextState;

		return valid(allEvents);
	}

	private generateDescription(command: FileSystemCommand): string {
		const commandType: string = command.type;
		return `Command executed: ${commandType}`;
	}

	private notifyListeners(event: FileSystemEvent): void {
		for (const listener of this.listeners) {
			listener(event);
		}
	}
}
