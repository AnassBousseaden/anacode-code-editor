import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type FileSystemWriteOrigin,
	isFileNode,
	type NodeID,
	type OperationError,
	type UpdateContentCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';

export class UpdateContentHandler implements ICommandHandler<UpdateContentCommand> {
	public execute(
		command: UpdateContentCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const nodeID: NodeID = command.nodeID;
		const newContent: string = command.newContent;
		const origin: FileSystemWriteOrigin = command.origin;

		const nodeExists: boolean = graph.exists(nodeID);
		if (!nodeExists) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		const node: FileSystemNode | undefined = state[nodeID];
		if (node === undefined) {
			return invalid(ErrorMessages.NODE_NOT_FOUND(nodeID));
		}

		if (!isFileNode(node)) {
			return invalid(ErrorMessages.NOT_A_FILE(nodeID));
		}

		const canWrite: boolean = node.permissions.write;
		if (!canWrite) {
			return invalid(ErrorMessages.PERMISSION_DENIED('write'));
		}

		const oldContent: string = node.content;

		const plan: AtomicPlanPayload = {
			type: FileSystemPlanType.NODE_CONTENT_UPDATED,
			nodeID: nodeID,
			oldContent: oldContent,
			newContent: newContent,
			origin: origin
		};

		return valid([plan]);
	}
}
