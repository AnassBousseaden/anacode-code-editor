import type { Result } from '$lib/core/shared/models-utils';
import { failure } from '$lib/core/shared/models-utils';
import type {
	ContentHash,
	FileSystemMap,
	FileSystemMapReadonly,
	FileSystemNode,
	IFileSystemEngine,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import {
	isFileNode,
	isFolderNode,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IMutableGraphIndex } from '$lib/core/file-system/graph/graph-index';
import { GraphIndex } from '$lib/core/file-system/graph/graph-index-impl';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { FileSystemEngine } from '$lib/core/file-system/engine/file-system-engine-impl';
import { FileSystemEventFactory } from '$lib/core/file-system/event-factory/file-system-event-factory';
import { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';
import {
	RandomEventIDGenerator,
	RandomNodeIDGenerator,
	SystemTimestampProvider
} from '$lib/core/file-system/loader/generators';
import { CommandRegistry } from '$lib/core/file-system/commands/file-system-command-registry-impl';
import type { ICommandRegistry } from '$lib/core/file-system/commands/file-system-commands';
import type { IFileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory';
import { FileSystemPathFactory } from '$lib/core/file-system/uri/file-system-path-factory-impl';
import type { IPlanExecutorRegistry } from '$lib/core/file-system/plan-execution/plan-executor';
import { PlanExecutorRegistry } from '$lib/core/file-system/plan-execution/plan-executor-registry-impl';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import { ContentHashService } from '$lib/core/file-system/hashing/content-hash';

const LoaderErrorMessages = {
	ROOT_NOT_FOLDER: (): string => 'Root node must be a folder',
	PARENT_NOT_FOLDER: (nodeID: NodeID, parentID: NodeID): string =>
		`Node ${nodeID} has parent ${parentID} which is not a folder`,
	DUPLICATE_SIBLING_NAME: (name: string, parentID: NodeID): string =>
		`Duplicate name "${name}" found in folder ${parentID}`,
	HASH_RESOLUTION_FAILED: (nodeID: NodeID, message: string): string =>
		`Content hash resolution failed for node ${nodeID}: ${message}`
} as const;

export class FileSystemLoader {
	public static async load(
		initialState: FileSystemMapReadonly
	): Promise<Result<IFileSystemEngine, OperationError>> {
		const graphResult: Result<IMutableGraphIndex, OperationError> =
			GraphIndex.fromState(initialState);

		if (!graphResult.ok) {
			return graphResult;
		}

		const graphIndex: IMutableGraphIndex = graphResult.value;

		const rootNode: FileSystemNode = initialState[ROOT_NODE_ID];

		if (!isFolderNode(rootNode)) {
			return invalid(LoaderErrorMessages.ROOT_NOT_FOLDER());
		}

		const parentTypeResult: Result<void, OperationError> = this.validateParentTypes(initialState);

		if (!parentTypeResult.ok) {
			return parentTypeResult;
		}

		const siblingNameResult: Result<void, OperationError> = this.validateSiblingNames(initialState);

		if (!siblingNameResult.ok) {
			return siblingNameResult;
		}

		const contentHashService: IContentHashService = new ContentHashService();

		const hashResolveResult: Result<FileSystemMapReadonly, OperationError> =
			await this.resolveContentHashes(initialState, contentHashService);

		if (!hashResolveResult.ok) {
			return hashResolveResult;
		}

		const resolvedState: FileSystemMapReadonly = hashResolveResult.value;

		const nodeFactory: NodeFactory = new NodeFactory(new RandomNodeIDGenerator());
		const eventFactory: FileSystemEventFactory = new FileSystemEventFactory(
			new RandomEventIDGenerator(),
			new SystemTimestampProvider()
		);
		const commandRegistry: ICommandRegistry = new CommandRegistry(nodeFactory);
		const pathFactory: IFileSystemPathFactory = new FileSystemPathFactory();
		const planExecutorRegistry: IPlanExecutorRegistry = new PlanExecutorRegistry(
			eventFactory,
			contentHashService
		);

		const engine: IFileSystemEngine = new FileSystemEngine(
			resolvedState,
			graphIndex,
			commandRegistry,
			planExecutorRegistry,
			eventFactory,
			pathFactory
		);

		return valid(engine);
	}

	private static async resolveContentHashes(
		state: FileSystemMapReadonly,
		contentHashService: IContentHashService
	): Promise<Result<FileSystemMapReadonly, OperationError>> {
		const resolvedMap: FileSystemMap = { ...state };
		const nodeIDStrings: string[] = Object.keys(state);

		for (const nodeIDString of nodeIDStrings) {
			const nodeID: NodeID = Number(nodeIDString) as NodeID;
			const node: FileSystemNode = state[nodeID];

			if (!isFileNode(node)) {
				continue;
			}

			const hashResult: Result<ContentHash, OperationError> = await contentHashService.computeHash(
				node.content
			);

			if (!hashResult.ok) {
				return failure({
					message: LoaderErrorMessages.HASH_RESOLUTION_FAILED(nodeID, hashResult.error.message)
				});
			}

			resolvedMap[nodeID] = {
				...node,
				contentHash: hashResult.value
			};
		}

		return valid(resolvedMap as FileSystemMapReadonly);
	}

	private static validateParentTypes(state: FileSystemMapReadonly): Result<void, OperationError> {
		const nodeIDStrings: string[] = Object.keys(state);

		for (const nodeIDString of nodeIDStrings) {
			const nodeID: NodeID = Number(nodeIDString) as NodeID;
			const node: FileSystemNode = state[nodeID];
			const parentID: NodeID | null = node.parentID;

			if (parentID === null) {
				continue;
			}

			const parentNode: FileSystemNode = state[parentID];

			if (!isFolderNode(parentNode)) {
				return invalid(LoaderErrorMessages.PARENT_NOT_FOLDER(nodeID, parentID));
			}
		}

		return valid(undefined);
	}

	private static validateSiblingNames(state: FileSystemMapReadonly): Result<void, OperationError> {
		const nodeIDStrings: string[] = Object.keys(state);
		const childrenByParent: Map<NodeID, Array<NodeID>> = new Map<NodeID, Array<NodeID>>();

		for (const nodeIDString of nodeIDStrings) {
			const nodeID: NodeID = Number(nodeIDString) as NodeID;
			const node: FileSystemNode = state[nodeID];
			const parentID: NodeID | null = node.parentID;

			if (parentID === null) {
				continue;
			}

			const siblings: Array<NodeID> | undefined = childrenByParent.get(parentID);

			if (siblings === undefined) {
				childrenByParent.set(parentID, [nodeID]);
			} else {
				siblings.push(nodeID);
			}
		}

		for (const [parentID, childIDs] of childrenByParent) {
			const namesInFolder: Set<string> = new Set<string>();

			for (const childID of childIDs) {
				const childNode: FileSystemNode = state[childID];
				const childName: string = childNode.name;

				if (namesInFolder.has(childName)) {
					return invalid(LoaderErrorMessages.DUPLICATE_SIBLING_NAME(childName, parentID));
				}

				namesInFolder.add(childName);
			}
		}

		return valid(undefined);
	}
}
