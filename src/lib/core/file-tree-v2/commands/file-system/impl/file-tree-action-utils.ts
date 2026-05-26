import type {
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type {
	FileTreeActionError,
	FileTreeInputActionAvailability
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';

export function getSingleSelectedNodeID(commandContext: FileTreeCommandContext): NodeID | null {
	const selection: ReadonlyArray<NodeID> | undefined =
		commandContext.fileTreeSelection?.selection;
	if (selection === undefined || selection.length !== 1) {
		return null;
	}

	const nodeID: NodeID = selection[0];
	return nodeID;
}

export function canCreateAt<PerformInput>(
	fileSystemService: IFileSystemService,
	commandContext: FileTreeCommandContext,
	errorFactory: IFileTreeActionErrorFactory,
	actionLabel: string,
	initialInput: PerformInput
): FileTreeInputActionAvailability<PerformInput> {
	const selection: ReadonlyArray<NodeID> = commandContext.fileTreeSelection?.selection ?? [];
	if (selection.length > 1) {
		const error: FileTreeActionError = errorFactory.createActionDisabledError(actionLabel);
		const availability: FileTreeInputActionAvailability<PerformInput> = {
			kind: CommandAvailabilityKind.UNAVAILABLE,
			reason: error
		};
		return availability;
	}

	const targetID: NodeID | null = selection.length > 0 ? selection[0] : null;
	const insertionParentID: NodeID = fileSystemService.getInsertionParentID(targetID);
	const parentNode: FileSystemNode | null = fileSystemService.getNode(insertionParentID);

	if (parentNode === null) {
		const error: FileTreeActionError = errorFactory.createMissingNodeError();
		const availability: FileTreeInputActionAvailability<PerformInput> = {
			kind: CommandAvailabilityKind.UNAVAILABLE,
			reason: error
		};
		return availability;
	}

	if (!parentNode.permissions.write) {
		const error: FileTreeActionError = errorFactory.createPermissionDeniedError(actionLabel);
		const availability: FileTreeInputActionAvailability<PerformInput> = {
			kind: CommandAvailabilityKind.UNAVAILABLE,
			reason: error
		};
		return availability;
	}

	const contextLabel: string = fileSystemService.getAbsolutePath(insertionParentID);
	const availability: FileTreeInputActionAvailability<PerformInput> = {
		kind: CommandAvailabilityKind.AVAILABLE,
		initialInput: initialInput,
		contextLabel: contextLabel
	};
	return availability;
}
