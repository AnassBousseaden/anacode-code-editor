import type {
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { CloseIntentError } from '$lib/core/editor/intent/editor-intent-models';
import { CloseIntentErrorKind } from '$lib/core/editor/intent/editor-intent-models';
import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
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
	DELETE_ACTION_DESCRIPTOR,
	type DeleteActionResult,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	type FileTreeActionAvailability,
	type IFileTreeAction
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { getSingleSelectedNodeID } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-utils';

export class DeleteAction implements IFileTreeAction<DeleteActionResult> {
	public readonly descriptor: FileTreeActionDescriptor;

	private readonly fileSystemService: IFileSystemService;
	private readonly actionErrorFactory: IFileTreeActionErrorFactory;
	private readonly intentCommands: IEditorIntentCommands;

	constructor(
		fileSystemService: IFileSystemService,
		actionErrorFactory: IFileTreeActionErrorFactory,
		intentCommands: IEditorIntentCommands
	) {
		this.fileSystemService = fileSystemService;
		this.actionErrorFactory = actionErrorFactory;
		this.intentCommands = intentCommands;
		this.descriptor = DELETE_ACTION_DESCRIPTOR;
	}

	public getAvailability(commandContext: FileTreeCommandContext): FileTreeActionAvailability {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const availability: FileTreeActionAvailability = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const availability: FileTreeActionAvailability = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		if (!node.permissions.delete) {
			const error: FileTreeActionError = this.actionErrorFactory.createPermissionDeniedError(
				this.descriptor.label
			);
			const availability: FileTreeActionAvailability = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const contextLabel: string = this.fileSystemService.getAbsolutePath(nodeID);
		const availability: FileTreeActionAvailability = {
			kind: CommandAvailabilityKind.AVAILABLE,
			contextLabel: contextLabel
		};
		return availability;
	}

	public async perform(
		commandContext: FileTreeCommandContext
	): Promise<Result<DeleteActionResult, FileTreeActionError>> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const result: Result<DeleteActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const result: Result<DeleteActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		if (!node.permissions.delete) {
			const error: FileTreeActionError = this.actionErrorFactory.createActionDisabledError(
				this.descriptor.label
			);
			const result: Result<DeleteActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const closeResult: Result<void, CloseIntentError> = await this.intentCommands.close(nodeID);
		if (!closeResult.ok) {
			const closeError: CloseIntentError = closeResult.error;
			const mappedError: FileTreeActionError = this.mapCloseError(closeError);
			return failure(mappedError);
		}

		const deletedPath: string = this.fileSystemService.getAbsolutePath(nodeID);
		const fsResult: Result<void, OperationError> = await this.fileSystemService.deleteNode(nodeID);
		if (!fsResult.ok) {
			const error: FileTreeActionError = this.actionErrorFactory.createFileSystemActionError(
				fsResult.error
			);
			return failure(error);
		}

		const actionResult: DeleteActionResult = {
			deletedNodeID: nodeID,
			deletedNodeName: node.name,
			deletedPath: deletedPath
		};
		return success(actionResult);
	}

	private mapCloseError(closeError: CloseIntentError): FileTreeActionError {
		switch (closeError.kind) {
			case CloseIntentErrorKind.UNSAVED_DRAFT:
				return this.actionErrorFactory.createUnsavedDraftError();
		}
	}
}
