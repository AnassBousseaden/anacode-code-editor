import {
	type FileSystemNode,
	type NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import {
	failure,
	type OperationError,
	type Result,
	success
} from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import {
	MOVE_ACTION_DESCRIPTOR,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	type FileTreeInputActionAvailability,
	type IFileTreeInputAction,
	type MoveActionInput,
	type MoveActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { getSingleSelectedNodeID } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-utils';

export class MoveAction implements IFileTreeInputAction<MoveActionInput, MoveActionResult> {
	public readonly descriptor: FileTreeActionDescriptor;

	private readonly fileSystemService: IFileSystemService;
	private readonly actionErrorFactory: IFileTreeActionErrorFactory;

	constructor(
		fileSystemService: IFileSystemService,
		actionErrorFactory: IFileTreeActionErrorFactory
	) {
		this.fileSystemService = fileSystemService;
		this.actionErrorFactory = actionErrorFactory;
		this.descriptor = MOVE_ACTION_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): FileTreeInputActionAvailability<MoveActionInput> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const availability: FileTreeInputActionAvailability<MoveActionInput> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const availability: FileTreeInputActionAvailability<MoveActionInput> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const currentFolderID: NodeID = this.fileSystemService.getInsertionParentID(nodeID);
		const initialInput: MoveActionInput = {
			targetNodeID: currentFolderID
		};
		const contextLabel: string = this.fileSystemService.getAbsolutePath(currentFolderID);
		const availability: FileTreeInputActionAvailability<MoveActionInput> = {
			kind: CommandAvailabilityKind.AVAILABLE,
			initialInput: initialInput,
			contextLabel: contextLabel
		};
		return availability;
	}

	public canPerform(
		commandContext: FileTreeCommandContext,
		performInput: MoveActionInput
	): Result<void, FileTreeActionError> {
		const availability: FileTreeInputActionAvailability<MoveActionInput> =
			this.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			return failure(error);
		}

		const targetParentID: NodeID = this.fileSystemService.getInsertionParentID(
			performInput.targetNodeID
		);
		const canMove: boolean = this.fileSystemService.canMoveNode(nodeID, targetParentID);
		if (!canMove) {
			const error: FileTreeActionError = this.actionErrorFactory.createInvalidTargetError();
			return failure(error);
		}

		return success<void>(undefined);
	}

	public async perform(
		commandContext: FileTreeCommandContext,
		performInput: MoveActionInput
	): Promise<Result<MoveActionResult, FileTreeActionError>> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const result: Result<MoveActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const result: Result<MoveActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const canPerform: Result<void, FileTreeActionError> = this.canPerform(
			commandContext,
			performInput
		);
		if (!canPerform.ok) {
			const result: Result<MoveActionResult, FileTreeActionError> = failure(canPerform.error);
			return result;
		}

		const targetParentID: NodeID = this.fileSystemService.getInsertionParentID(
			performInput.targetNodeID
		);
		const oldParentID: NodeID | null = node.parentID;
		const fsResult: Result<void, OperationError> = await this.fileSystemService.moveNode(
			nodeID,
			targetParentID
		);

		if (!fsResult.ok) {
			const error: FileTreeActionError = this.actionErrorFactory.createFileSystemActionError(
				fsResult.error
			);
			const result: Result<MoveActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const actionResult: MoveActionResult = {
			movedNodeID: nodeID,
			movedNodeName: node.name,
			oldParentID: oldParentID,
			newParentID: targetParentID
		};
		const result: Result<MoveActionResult, FileTreeActionError> = success(actionResult);
		return result;
	}
}
