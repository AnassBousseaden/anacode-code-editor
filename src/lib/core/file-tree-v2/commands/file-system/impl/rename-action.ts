import type {
	FileSystemNode,
	NodeID
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
	type FileTreeInputActionAvailability,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	type IFileTreeInputAction,
	type RenameActionInput,
	type RenameActionResult,
	RENAME_ACTION_DESCRIPTOR
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { getSingleSelectedNodeID } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-utils';

export class RenameAction implements IFileTreeInputAction<RenameActionInput, RenameActionResult> {
	public readonly descriptor: FileTreeActionDescriptor;

	private readonly fileSystemService: IFileSystemService;
	private readonly actionErrorFactory: IFileTreeActionErrorFactory;

	constructor(
		fileSystemService: IFileSystemService,
		actionErrorFactory: IFileTreeActionErrorFactory
	) {
		this.fileSystemService = fileSystemService;
		this.actionErrorFactory = actionErrorFactory;
		this.descriptor = RENAME_ACTION_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): FileTreeInputActionAvailability<RenameActionInput> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const availability: FileTreeInputActionAvailability<RenameActionInput> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const availability: FileTreeInputActionAvailability<RenameActionInput> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		if (!node.permissions.rename) {
			const error: FileTreeActionError = this.actionErrorFactory.createPermissionDeniedError(
				this.descriptor.label
			);
			const availability: FileTreeInputActionAvailability<RenameActionInput> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const initialInput: RenameActionInput = {
			newName: node.name
		};
		const contextLabel: string = this.fileSystemService.getAbsolutePath(nodeID);
		const availability: FileTreeInputActionAvailability<RenameActionInput> = {
			kind: CommandAvailabilityKind.AVAILABLE,
			initialInput: initialInput,
			contextLabel: contextLabel
		};
		return availability;
	}

	public canPerform(
		commandContext: FileTreeCommandContext,
		performInput: RenameActionInput
	): Result<void, FileTreeActionError> {
		const availability: FileTreeInputActionAvailability<RenameActionInput> =
			this.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const name: string = performInput.newName;
		const trimmedName: string = name.trim();
		if (trimmedName.length === 0) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNameError();
			return failure(error);
		}

		return success<void>(undefined);
	}

	public async perform(
		commandContext: FileTreeCommandContext,
		performInput: RenameActionInput
	): Promise<Result<RenameActionResult, FileTreeActionError>> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		if (!node.permissions.rename) {
			const error: FileTreeActionError = this.actionErrorFactory.createActionDisabledError(
				this.descriptor.label
			);
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const name: string = performInput.newName;
		const trimmedName: string = name.trim();
		if (trimmedName.length === 0) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNameError();
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const fsResult: Result<void, OperationError> = await this.fileSystemService.renameNode(
			nodeID,
			name
		);
		if (!fsResult.ok) {
			const error: FileTreeActionError = this.actionErrorFactory.createFileSystemActionError(
				fsResult.error
			);
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const actionResult: RenameActionResult = {
			renamedNodeID: nodeID,
			oldName: node.name,
			newName: name
		};
		const result: Result<RenameActionResult, FileTreeActionError> = success(actionResult);
		return result;
	}
}
