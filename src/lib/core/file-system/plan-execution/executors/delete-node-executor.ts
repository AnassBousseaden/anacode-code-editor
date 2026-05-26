import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	AtomicPlanPayload,
	FileSystemMap,
	FileSystemNode,
	NodeDeletePlan,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import {
	FileSystemPlanType,
	NodeType
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { Result } from '$lib/core/shared/models-utils';
import { success } from '$lib/core/shared/models-utils';
import type { IPlanExecutor } from '$lib/core/file-system/plan-execution/plan-executor';
import { snapshotNode } from '$lib/core/file-system/plan-execution/draft-utils';

export class DeleteNodeExecutor implements IPlanExecutor<NodeDeletePlan> {
	private readonly eventFactory: FileSystemEventFactory;

	constructor(eventFactory: FileSystemEventFactory) {
		this.eventFactory = eventFactory;
	}

	async execute(
		draft: Draft<FileSystemMap>,
		plan: NodeDeletePlan,
		graph: IMutableGraphIndex,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const nodeID: NodeID = plan.nodeID;
		const subtreeNodeIDs: ReadonlyArray<NodeID> = graph.getSubtree(nodeID);
		const events: AtomicEventPayload[] = [];
		const graphPlans: AtomicPlanPayload[] = [];

		for (const subtreeNodeID of subtreeNodeIDs) {
			const subtreeNode: Draft<FileSystemNode> | undefined = draft[subtreeNodeID];

			if (subtreeNode === undefined) {
				continue;
			}

			const beforeSnapshot: FileSystemNode = snapshotNode(subtreeNode);

			const parentID: NodeID | null = subtreeNode.parentID;

			if (parentID !== null) {
				const parentNode: Draft<FileSystemNode> | undefined = draft[parentID];

				if (parentNode !== undefined && parentNode.type === NodeType.FOLDER) {
					const children: NodeID[] = parentNode.children;
					const childIndex: number = children.indexOf(subtreeNodeID);

					if (childIndex !== -1) {
						children.splice(childIndex, 1);
					}
				}
			}

			delete draft[subtreeNodeID];

			events.push(this.eventFactory.createNodeDeletedEvent(beforeSnapshot));

			graphPlans.push({
				type: FileSystemPlanType.NODE_DELETE,
				nodeID: subtreeNodeID
			});
		}

		const graphResult: Result<void, OperationError> = graph.apply(graphPlans);

		if (!graphResult.ok) {
			return graphResult;
		}

		return success(events);
	}
}
