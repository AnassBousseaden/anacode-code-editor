import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import {
	failure,
	success,
	type Result,
	type OperationError
} from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import {
	CREATE_FOLDER_ACTION_DESCRIPTOR,
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	type FileTreeInputActionAvailability,
	type IFileTreeInputAction
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { canCreateAt } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-utils';

export class CreateFolderAction implements IFileTreeInputAction<
	CreateFolderActionInput,
	CreateFolderActionResult
> {
	public readonly descriptor: FileTreeActionDescriptor;

	private readonly fileSystemService: IFileSystemService;
	private readonly actionErrorFactory: IFileTreeActionErrorFactory;

	constructor(
		fileSystemService: IFileSystemService,
		actionErrorFactory: IFileTreeActionErrorFactory
	) {
		this.fileSystemService = fileSystemService;
		this.actionErrorFactory = actionErrorFactory;
		this.descriptor = CREATE_FOLDER_ACTION_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): FileTreeInputActionAvailability<CreateFolderActionInput> {
		const initialInput: CreateFolderActionInput = {
			name: ''
		};
		const availability: FileTreeInputActionAvailability<CreateFolderActionInput> = canCreateAt(
			this.fileSystemService,
			commandContext,
			this.actionErrorFactory,
			this.descriptor.label,
			initialInput
		);
		return availability;
	}

	public canPerform(
		commandContext: FileTreeCommandContext,
		performInput: CreateFolderActionInput
	): Result<void, FileTreeActionError> {
		const availability: FileTreeInputActionAvailability<CreateFolderActionInput> =
			this.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<void, FileTreeActionError> = failure(availability.reason);
			return result;
		}

		const name: string = performInput.name;
		const trimmedName: string = name.trim();
		if (trimmedName.length === 0) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNameError();
			return failure(error);
		}

		return success<void>(undefined);
	}

	public async perform(
		commandContext: FileTreeCommandContext,
		performInput: CreateFolderActionInput
	): Promise<Result<CreateFolderActionResult, FileTreeActionError>> {
		const availability: FileTreeInputActionAvailability<CreateFolderActionInput> =
			this.getAvailability(commandContext);
		if (availability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const result: Result<CreateFolderActionResult, FileTreeActionError> = failure(
				availability.reason
			);
			return result;
		}

		const name: string = performInput.name;
		const trimmedName: string = name.trim();
		if (trimmedName.length === 0) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNameError();
			const result: Result<CreateFolderActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const selection: ReadonlyArray<NodeID> = commandContext.fileTreeSelection?.selection ?? [];
		const targetID: NodeID | null = selection.length > 0 ? selection[0] : null;
		const parentID: NodeID = this.fileSystemService.getInsertionParentID(targetID);
		const fsResult: Result<NodeID, OperationError> = await this.fileSystemService.createFolder(
			parentID,
			name
		);
		if (!fsResult.ok) {
			const error: FileTreeActionError = this.actionErrorFactory.createFileSystemActionError(
				fsResult.error
			);
			const result: Result<CreateFolderActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const actionResult: CreateFolderActionResult = {
			createdNodeID: fsResult.value
		};
		const result: Result<CreateFolderActionResult, FileTreeActionError> = success(actionResult);
		return result;
	}
}
