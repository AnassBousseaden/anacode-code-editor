import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type CreateFileCommand,
	DEFAULT_PERMISSIONS,
	type FileNodeSpec,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type FolderNode,
	isFolderNode,
	type NodeID,
	type OperationError,
	type UserSpaceTag,
	type ValidationResult
} from '$lib/core/file-system/domain/file-system-models';
import type { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';
import {
	checkNameCollision,
	validateNodeName
} from '$lib/core/file-system/commands/file-system-commands-impl-utils';

export class CreateFileHandler implements ICommandHandler<CreateFileCommand> {
	private readonly nodeFactory: NodeFactory;

	public constructor(nodeFactory: NodeFactory) {
		this.nodeFactory = nodeFactory;
	}

	public execute(
		command: CreateFileCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const parentID: NodeID = command.parentID;
		const fileName: string = command.name;

		const parentExists: boolean = graph.exists(parentID);
		if (!parentExists) {
			return invalid(ErrorMessages.PARENT_NOT_FOUND(parentID));
		}

		const parentNode: FileSystemNode | undefined = state[parentID];
		if (parentNode === undefined) {
			return invalid(ErrorMessages.PARENT_NOT_FOUND(parentID));
		}

		if (!isFolderNode(parentNode)) {
			return invalid(ErrorMessages.PARENT_NOT_FOLDER(parentID));
		}

		const canWrite: boolean = parentNode.permissions.write;
		if (!canWrite) {
			return invalid(ErrorMessages.PERMISSION_DENIED('write'));
		}

		const nameValidation: ValidationResult<void> = validateNodeName(fileName);
		if (!nameValidation.ok) {
			return nameValidation;
		}

		const collisionCheck: ValidationResult<void> = checkNameCollision(parentNode, fileName, state);
		if (!collisionCheck.ok) {
			return collisionCheck;
		}

		const commandUserSpace: UserSpaceTag | null = command.userSpace;
		const parentFolder: FolderNode = parentNode as FolderNode;
		const effectiveUserSpace: UserSpaceTag | null =
			commandUserSpace !== null ? commandUserSpace : parentFolder.userSpace;

		const nodeSpec: FileNodeSpec = this.nodeFactory.createFileNode(
			parentID,
			fileName,
			'',
			DEFAULT_PERMISSIONS,
			effectiveUserSpace
		);

		const plan: AtomicPlanPayload = {
			type: FileSystemPlanType.NODE_CREATE,
			node: nodeSpec
		};

		return valid([plan]);
	}
}
