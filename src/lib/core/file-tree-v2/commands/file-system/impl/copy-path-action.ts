import type {
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import { failure, type Result, success } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import {
	COPY_PATH_ACTION_DESCRIPTOR,
	type CopyPathActionResult,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	type FileTreeActionAvailability,
	type IFileTreeAction
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { getSingleSelectedNodeID } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-utils';

export class CopyPathAction implements IFileTreeAction<CopyPathActionResult> {
	public readonly descriptor: FileTreeActionDescriptor;

	private readonly fileSystemService: IFileSystemService;
	private readonly actionErrorFactory: IFileTreeActionErrorFactory;

	constructor(
		fileSystemService: IFileSystemService,
		actionErrorFactory: IFileTreeActionErrorFactory
	) {
		this.fileSystemService = fileSystemService;
		this.actionErrorFactory = actionErrorFactory;
		this.descriptor = COPY_PATH_ACTION_DESCRIPTOR;
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

		const contextLabel: string = this.fileSystemService.getAbsolutePath(nodeID);
		const availability: FileTreeActionAvailability = {
			kind: CommandAvailabilityKind.AVAILABLE,
			contextLabel: contextLabel
		};
		return availability;
	}

	public async perform(
		commandContext: FileTreeCommandContext
	): Promise<Result<CopyPathActionResult, FileTreeActionError>> {
		const nodeID: NodeID | null = getSingleSelectedNodeID(commandContext);
		if (nodeID === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingSelectionError();
			const result: Result<CopyPathActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			const error: FileTreeActionError = this.actionErrorFactory.createMissingNodeError();
			const result: Result<CopyPathActionResult, FileTreeActionError> = failure(error);
			return result;
		}

		const path: string = this.fileSystemService.getAbsolutePath(nodeID);
		const actionResult: CopyPathActionResult = {
			copiedPath: path
		};
		const result: Result<CopyPathActionResult, FileTreeActionError> = success(actionResult);
		return result;
	}
}
