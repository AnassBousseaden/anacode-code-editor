import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type DeleteNodeCommand,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type NodeID,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';

export class DeleteNodeHandler implements ICommandHandler<DeleteNodeCommand> {
	public execute(
		command: DeleteNodeCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const nodeID: NodeID = command.nodeID;

		if (nodeID === ROOT_NODE_ID) {
			return invalid(ErrorMessages.CANNOT_DELETE_ROOT());
		}

		const nodeExists: boolean = graph.exists(nodeID);
		if (!nodeExists) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const node: FileSystemNode | undefined = state[nodeID];
		if (node === undefined) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const canDelete: boolean = node.permissions.delete;
		if (!canDelete) {
			return invalid(ErrorMessages.PERMISSION_DENIED('delete'));
		}

		const plan: AtomicPlanPayload = {
			type: FileSystemPlanType.NODE_DELETE,
			nodeID: nodeID
		};

		return valid([plan]);
	}
}
