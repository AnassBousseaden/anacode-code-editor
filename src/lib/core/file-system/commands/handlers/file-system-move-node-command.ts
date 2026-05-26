import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	isFolderNode,
	type MoveNodeCommand,
	type NodeID,
	type OperationError,
	ROOT_NODE_ID,
	type ValidationResult
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';
import { checkNameCollision } from '$lib/core/file-system/commands/file-system-commands-impl-utils';

export class MoveNodeHandler implements ICommandHandler<MoveNodeCommand> {
	public execute(
		command: MoveNodeCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const nodeID: NodeID = command.nodeID;
		const newParentID: NodeID = command.newParentID;

		if (nodeID === ROOT_NODE_ID) {
			return invalid(ErrorMessages.CANNOT_MOVE_ROOT());
		}

		const nodeExists: boolean = graph.exists(nodeID);
		if (!nodeExists) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const node: FileSystemNode | undefined = state[nodeID];
		if (node === undefined) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const newParentExists: boolean = graph.exists(newParentID);
		if (!newParentExists) {
			return invalid(ErrorMessages.PARENT_NOT_FOUND(newParentID));
		}

		const newParentNode: FileSystemNode | undefined = state[newParentID];
		if (newParentNode === undefined) {
			return invalid(ErrorMessages.PARENT_NOT_FOUND(newParentID));
		}

		if (!isFolderNode(newParentNode)) {
			return invalid(ErrorMessages.PARENT_NOT_FOLDER(newParentID));
		}

		const oldParentID: NodeID | null = node.parentID;
		if (oldParentID === newParentID) {
			return invalid(ErrorMessages.CANNOT_MOVE_TO_SAME_PARENT());
		}

		const moveValidation: Result<void, OperationError> = graph.validateMove(nodeID, newParentID);
		if (!moveValidation.ok) {
			return moveValidation;
		}

		const canDelete: boolean = node.permissions.delete;
		if (!canDelete) {
			return invalid(ErrorMessages.PERMISSION_DENIED('delete'));
		}

		const canWrite: boolean = newParentNode.permissions.write;
		if (!canWrite) {
			return invalid(ErrorMessages.PERMISSION_DENIED('write'));
		}

		const nodeName: string = node.name;
		const collisionCheck: ValidationResult<void> = checkNameCollision(
			newParentNode,
			nodeName,
			state
		);
		if (!collisionCheck.ok) {
			return collisionCheck;
		}

		if (oldParentID === null) {
			return invalid(ErrorMessages.CANNOT_MOVE_ROOT());
		}

		const plan: AtomicPlanPayload = {
			type: FileSystemPlanType.NODE_MOVE,
			nodeID: nodeID,
			oldParentID: oldParentID,
			newParentID: newParentID
		};

		return valid([plan]);
	}
}
