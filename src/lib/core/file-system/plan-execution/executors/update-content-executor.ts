import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	ContentHash,
	FileNode,
	FileSystemMap,
	FileSystemNode,
	NodeContentUpdatedPlan,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import { NodeType } from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import type { IPlanExecutor } from '$lib/core/file-system/plan-execution/plan-executor';
import { snapshotNode } from '$lib/core/file-system/plan-execution/draft-utils';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';

export class UpdateContentExecutor implements IPlanExecutor<NodeContentUpdatedPlan> {
	private readonly eventFactory: FileSystemEventFactory;
	private readonly contentHashService: IContentHashService;

	constructor(eventFactory: FileSystemEventFactory, contentHashService: IContentHashService) {
		this.eventFactory = eventFactory;
		this.contentHashService = contentHashService;
	}

	async execute(
		draft: Draft<FileSystemMap>,
		plan: NodeContentUpdatedPlan,
		_graph: IMutableGraphIndex,
		_pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const node: Draft<FileSystemNode> | undefined = draft[plan.nodeID];

		if (node === undefined) {
			return success([]);
		}

		if (node.type !== NodeType.FILE) {
			return success([]);
		}

		const beforeSnapshot: FileNode = snapshotNode(node) as FileNode;

		const hashResult: Result<ContentHash, OperationError> =
			await this.contentHashService.computeHash(plan.newContent);

		if (!hashResult.ok) {
			return failure(hashResult.error);
		}

		node.content = plan.newContent;
		node.contentHash = hashResult.value;

		const afterSnapshot: FileNode = snapshotNode(node) as FileNode;

		return success([
			this.eventFactory.createNodeUpdatedEvent(beforeSnapshot, afterSnapshot, plan.origin)
		]);
	}
}
