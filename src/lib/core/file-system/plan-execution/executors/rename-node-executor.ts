import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	FileSystemMap,
	FileSystemNode,
	FileSystemPath,
	NodeID,
	NodeRenamePlan,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import type { IPlanExecutor } from '$lib/core/file-system/plan-execution/plan-executor';
import { snapshotNode } from '$lib/core/file-system/plan-execution/draft-utils';

const ErrorMessages = {
	PATH_RESOLUTION_FAILED: (nodeID: NodeID, message: string): string =>
		`Path resolution failed for node ${nodeID} during rename: ${message}`
} as const;

export class RenameNodeExecutor implements IPlanExecutor<NodeRenamePlan> {
	private readonly eventFactory: FileSystemEventFactory;

	constructor(eventFactory: FileSystemEventFactory) {
		this.eventFactory = eventFactory;
	}

	async execute(
		draft: Draft<FileSystemMap>,
		plan: NodeRenamePlan,
		graph: IMutableGraphIndex,
		pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const nodeID: NodeID = plan.nodeID;
		const node: Draft<FileSystemNode> | undefined = draft[nodeID];

		if (node === undefined) {
			return success([]);
		}

		const beforeSnapshot: FileSystemNode = snapshotNode(node);

		const subtreeNodeIDs: ReadonlyArray<NodeID> = graph.getSubtree(nodeID);
		const beforePaths: Map<NodeID, FileSystemPath> = new Map<NodeID, FileSystemPath>();

		for (const descendantID of subtreeNodeIDs) {
			const descendantNode: Draft<FileSystemNode> | undefined = draft[descendantID];

			if (descendantNode !== undefined) {
				beforePaths.set(descendantID, descendantNode.path);
			}
		}

		node.name = plan.newName;

		for (const descendantID of subtreeNodeIDs) {
			const descendantNode: Draft<FileSystemNode> | undefined = draft[descendantID];

			if (descendantNode === undefined) {
				continue;
			}

			const pathResult: Result<FileSystemPath, OperationError> = pathFactory.buildPath(
				descendantID,
				draft,
				graph
			);

			if (!pathResult.ok) {
				return failure({
					message: ErrorMessages.PATH_RESOLUTION_FAILED(descendantID, pathResult.error.message)
				});
			}

			descendantNode.path = pathResult.value;
		}

		const events: AtomicEventPayload[] = [];

		const afterSnapshot: FileSystemNode = snapshotNode(node);
		events.push(
			this.eventFactory.createNodeRenamedEvent(
				beforeSnapshot,
				afterSnapshot,
				plan.oldName,
				plan.newName
			)
		);

		for (const descendantID of subtreeNodeIDs) {
			if (descendantID === nodeID) {
				continue;
			}

			const oldPath: FileSystemPath | undefined = beforePaths.get(descendantID);
			const descendantNode: Draft<FileSystemNode> | undefined = draft[descendantID];

			if (oldPath === undefined || descendantNode === undefined) {
				continue;
			}

			const afterDescendant: FileSystemNode = snapshotNode(descendantNode);
			const beforeDescendant: FileSystemNode = { ...afterDescendant, path: oldPath };

			events.push(
				this.eventFactory.createNodePathChangedEvent(
					beforeDescendant,
					afterDescendant,
					oldPath,
					afterDescendant.path
				)
			);
		}

		return success(events);
	}
}
