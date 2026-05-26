import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	isFolderNode,
	type NodeID,
	type OperationError,
	type RenameNodeCommand,
	type ValidationResult
} from '$lib/core/file-system/domain/file-system-models';
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

export class RenameNodeHandler implements ICommandHandler<RenameNodeCommand> {
	public execute(
		command: RenameNodeCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const nodeID: NodeID = command.nodeID;
		const newName: string = command.newName;

		const nodeExists: boolean = graph.exists(nodeID);
		if (!nodeExists) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const node: FileSystemNode | undefined = state[nodeID];
		if (node === undefined) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const isSameName: boolean = node.name === newName;
		if (isSameName) {
			return valid([]);
		}

		const canRename: boolean = node.permissions.rename;
		if (!canRename) {
			return invalid(ErrorMessages.PERMISSION_DENIED('rename'));
		}

		const nameValidation: ValidationResult<void> = validateNodeName(newName);
		if (!nameValidation.ok) {
			return nameValidation;
		}

		const parentID: NodeID | null = node.parentID;
		if (parentID !== null) {
			const parentNode: FileSystemNode | undefined = state[parentID];

			if (parentNode !== undefined && isFolderNode(parentNode)) {
				const collisionCheck: ValidationResult<void> = checkNameCollision(
					parentNode,
					newName,
					state,
					nodeID
				);

				if (!collisionCheck.ok) {
					return collisionCheck;
				}
			}
		}

		const oldName: string = node.name;

		const plan: AtomicPlanPayload = {
			type: FileSystemPlanType.NODE_RENAME,
			nodeID: nodeID,
			oldName: oldName,
			newName: newName
		};

		return valid([plan]);
	}
}
