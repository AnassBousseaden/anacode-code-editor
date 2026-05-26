import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	FileSystemMap,
	FileSystemNode,
	FileSystemPath,
	NodeID,
	NodeMovePlan,
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

const ErrorMessages = {
	PATH_RESOLUTION_FAILED: (nodeID: NodeID, message: string): string =>
		`Path resolution failed for node ${nodeID} during move: ${message}`
} as const;

export class MoveNodeExecutor implements IPlanExecutor<NodeMovePlan> {
	private readonly eventFactory: FileSystemEventFactory;

	constructor(eventFactory: FileSystemEventFactory) {
		this.eventFactory = eventFactory;
	}

	async execute(
		draft: Draft<FileSystemMap>,
		plan: NodeMovePlan,
		graph: IMutableGraphIndex,
		pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const nodeID: NodeID = plan.nodeID;
		const oldParentID: NodeID = plan.oldParentID;
		const newParentID: NodeID = plan.newParentID;
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

		const oldParentNode: Draft<FileSystemNode> | undefined = draft[oldParentID];

		if (oldParentNode !== undefined && oldParentNode.type === NodeType.FOLDER) {
			const oldChildren: NodeID[] = oldParentNode.children;
			const oldIndex: number = oldChildren.indexOf(nodeID);

			if (oldIndex !== -1) {
				oldChildren.splice(oldIndex, 1);
			}
		}

		const newParentNode: Draft<FileSystemNode> | undefined = draft[newParentID];

		if (newParentNode !== undefined && newParentNode.type === NodeType.FOLDER) {
			const newChildren: NodeID[] = newParentNode.children;
			newChildren.push(nodeID);
		}

		node.parentID = newParentID;

		const graphResult: Result<void, OperationError> = graph.apply([plan]);

		if (!graphResult.ok) {
			return graphResult;
		}

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
			this.eventFactory.createNodeMovedEvent(
				beforeSnapshot,
				afterSnapshot,
				oldParentID,
				newParentID
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
