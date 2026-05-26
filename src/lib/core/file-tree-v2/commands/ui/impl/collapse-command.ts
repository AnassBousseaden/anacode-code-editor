import { success, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import {
	COLLAPSE_NODE_UI_COMMAND_DESCRIPTOR,
	type FileTreeUICommandDescriptor,
	type FileTreeUICommandError,
	type IFileTreeUICommand
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

export class CollapseCommand implements IFileTreeUICommand {
	public readonly descriptor: FileTreeUICommandDescriptor;

	private readonly fileTree: IFileTree;

	constructor(fileTree: IFileTree) {
		this.fileTree = fileTree;
		this.descriptor = COLLAPSE_NODE_UI_COMMAND_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): CommandAvailability<FileTreeUICommandError> {
		void commandContext;
		const availability: CommandAvailability<FileTreeUICommandError> = {
			kind: CommandAvailabilityKind.AVAILABLE
		};
		return availability;
	}

	public async perform(
		commandContext: FileTreeCommandContext
	): Promise<Result<void, FileTreeUICommandError>> {
		void commandContext;
		this.fileTree.collapseAll();
		const result: Result<void, FileTreeUICommandError> = success<void>(undefined);
		return result;
	}
}
