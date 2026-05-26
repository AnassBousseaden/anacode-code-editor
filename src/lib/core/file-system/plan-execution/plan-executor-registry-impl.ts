import type {
	AtomicPlanPayload,
	FileSystemPlanType
} from '$lib/core/file-system/domain/file-system-models';
import { FileSystemPlanType as PlanType } from '$lib/core/file-system/domain/file-system-models';
import type {
	IPlanExecutor,
	IPlanExecutorRegistry
} from '$lib/core/file-system/plan-execution/plan-executor';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import { CreateNodeExecutor } from '$lib/core/file-system/plan-execution/executors/create-node-executor';
import { DeleteNodeExecutor } from '$lib/core/file-system/plan-execution/executors/delete-node-executor';
import { RenameNodeExecutor } from '$lib/core/file-system/plan-execution/executors/rename-node-executor';
import { MoveNodeExecutor } from '$lib/core/file-system/plan-execution/executors/move-node-executor';
import { UpdateContentExecutor } from '$lib/core/file-system/plan-execution/executors/update-content-executor';

export class PlanExecutorRegistry implements IPlanExecutorRegistry {
	private readonly executors: ReadonlyMap<FileSystemPlanType, IPlanExecutor<AtomicPlanPayload>>;

	constructor(eventFactory: FileSystemEventFactory, contentHashService: IContentHashService) {
		const executors: Map<FileSystemPlanType, IPlanExecutor<AtomicPlanPayload>> = new Map();

		executors.set(PlanType.NODE_CREATE, new CreateNodeExecutor(eventFactory, contentHashService));
		executors.set(PlanType.NODE_DELETE, new DeleteNodeExecutor(eventFactory));
		executors.set(PlanType.NODE_RENAME, new RenameNodeExecutor(eventFactory));
		executors.set(PlanType.NODE_MOVE, new MoveNodeExecutor(eventFactory));
		executors.set(
			PlanType.NODE_CONTENT_UPDATED,
			new UpdateContentExecutor(eventFactory, contentHashService)
		);

		this.executors = executors;
	}

	getExecutor(type: FileSystemPlanType): IPlanExecutor<AtomicPlanPayload> | undefined {
		return this.executors.get(type);
	}
}
