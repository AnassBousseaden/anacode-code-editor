import type { ICommandHandler } from '$lib/core/file-system/commands/file-system-commands';
import {
	type AtomicPlanPayload,
	type ContentHash,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type FileSystemWriteOrigin,
	isFileNode,
	type NodeID,
	type OperationError,
	type UpdateContentIfCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { IGraphIndex } from '$lib/core/file-system/graph/graph-index';
import type { Result } from '$lib/core/shared/models-utils';
import {
	invalid,
	valid
} from '$lib/core/file-system/domain/file-system-computation-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';

export class UpdateContentIfHandler implements ICommandHandler<UpdateContentIfCommand> {
	public execute(
		command: UpdateContentIfCommand,
		state: FileSystemMapReadonly,
		graph: IGraphIndex
	): Result<AtomicPlanPayload[], OperationError> {
		const nodeID: NodeID = command.nodeID;
		const newContent: string = command.newContent;
		const origin: FileSystemWriteOrigin = command.origin;
		const targetHash: ContentHash = command.targetHash;

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

		const currentHash: ContentHash = node.contentHash;
		if (currentHash !== targetHash) {
			return invalid(ErrorMessages.HASH_MISMATCH(targetHash, currentHash));
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
