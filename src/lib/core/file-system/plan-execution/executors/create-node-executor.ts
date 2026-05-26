import type { Draft } from 'immer';

import type {
	AtomicEventPayload,
	ContentHash,
	FileNode,
	FileSystemMap,
	FileSystemNode,
	FileSystemPath,
	FolderNode,
	NodeCreatePlan,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import {
	isFileNodeSpec,
	isFolderNode,
	isFolderNodeSpec,
	NodeType
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import type { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import type { IPlanExecutor } from '$lib/core/file-system/plan-execution/plan-executor';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';

const ErrorMessages = {
	PATH_RESOLUTION_FAILED: (nodeID: NodeID, message: string): string =>
		`Path resolution failed for created node ${nodeID}: ${message}`
} as const;

export class CreateNodeExecutor implements IPlanExecutor<NodeCreatePlan> {
	private readonly eventFactory: FileSystemEventFactory;
	private readonly contentHashService: IContentHashService;

	constructor(eventFactory: FileSystemEventFactory, contentHashService: IContentHashService) {
		this.eventFactory = eventFactory;
		this.contentHashService = contentHashService;
	}

	async execute(
		draft: Draft<FileSystemMap>,
		plan: NodeCreatePlan,
		graph: IMutableGraphIndex,
		pathFactory: IFileSystemPathFactory
	): Promise<Result<ReadonlyArray<AtomicEventPayload>, OperationError>> {
		const nodeSpec = plan.node;
		const nodeID: NodeID = nodeSpec.id;
		const parentID: NodeID | null = nodeSpec.parentID;
		let fileContentHash: ContentHash | null = null;

		if (isFileNodeSpec(nodeSpec)) {
			const hashResult: Result<ContentHash, OperationError> =
				await this.contentHashService.computeHash(nodeSpec.content);

			if (!hashResult.ok) {
				return failure(hashResult.error);
			}

			fileContentHash = hashResult.value;

			const fileNode: FileNode = {
				id: nodeSpec.id,
				parentID: nodeSpec.parentID,
				name: nodeSpec.name,
				path: '' as FileSystemPath,
				type: NodeType.FILE,
				content: nodeSpec.content,
				contentHash: fileContentHash,
				permissions: nodeSpec.permissions,
				userSpace: nodeSpec.userSpace
			};
			draft[nodeID] = fileNode;
		}

		if (isFolderNodeSpec(nodeSpec)) {
			draft[nodeID] = {
				id: nodeSpec.id,
				parentID: nodeSpec.parentID,
				name: nodeSpec.name,
				path: '' as FileSystemPath,
				type: NodeType.FOLDER,
				children: [] as NodeID[],
				permissions: nodeSpec.permissions,
				userSpace: nodeSpec.userSpace
			};
		}

		if (parentID !== null) {
			const parentNode: Draft<FileSystemNode> | undefined = draft[parentID];

			if (parentNode !== undefined && isFolderNode(parentNode as FileSystemNode)) {
				const parentFolder: Draft<FolderNode> = parentNode as Draft<FolderNode>;
				const children: NodeID[] = parentFolder.children;
				children.push(nodeID);
			}
		}

		const graphResult: Result<void, OperationError> = graph.apply([plan]);

		if (!graphResult.ok) {
			return graphResult;
		}

		const pathResult: Result<FileSystemPath, OperationError> = pathFactory.buildPath(
			nodeID,
			draft,
			graph
		);

		if (!pathResult.ok) {
			return failure({
				message: ErrorMessages.PATH_RESOLUTION_FAILED(nodeID, pathResult.error.message)
			});
		}

		const draftNode: Draft<FileSystemNode> | undefined = draft[nodeID];

		if (draftNode === undefined) {
			return success([]);
		}

		draftNode.path = pathResult.value;

		if (isFileNodeSpec(nodeSpec) && fileContentHash !== null) {
			const resolvedNode: FileNode = {
				id: nodeSpec.id,
				parentID: nodeSpec.parentID,
				name: nodeSpec.name,
				path: pathResult.value,
				type: NodeType.FILE,
				content: nodeSpec.content,
				contentHash: fileContentHash,
				permissions: nodeSpec.permissions,
				userSpace: nodeSpec.userSpace
			};
			return success([this.eventFactory.createNodeCreatedEvent(resolvedNode)]);
		}

		if (isFolderNodeSpec(nodeSpec)) {
			const resolvedNode: FolderNode = {
				id: nodeSpec.id,
				parentID: nodeSpec.parentID,
				name: nodeSpec.name,
				path: pathResult.value,
				type: NodeType.FOLDER,
				children: [],
				permissions: nodeSpec.permissions,
				userSpace: nodeSpec.userSpace
			};
			return success([this.eventFactory.createNodeCreatedEvent(resolvedNode)]);
		}

		return success([]);
	}
}
