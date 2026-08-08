import { success, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IFileTreeSearchCommands } from '$lib/core/file-tree-v2/search/file-tree-search-service';
import {
	REVEAL_SEARCH_UI_COMMAND_DESCRIPTOR,
	type FileTreeUICommandDescriptor,
	type FileTreeUICommandError,
	type IFileTreeUICommand
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

export class RevealSearchCommand implements IFileTreeUICommand {
	public readonly descriptor: FileTreeUICommandDescriptor;

	private readonly searchCommands: IFileTreeSearchCommands;

	constructor(searchCommands: IFileTreeSearchCommands) {
		this.searchCommands = searchCommands;
		this.descriptor = REVEAL_SEARCH_UI_COMMAND_DESCRIPTOR;
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
		this.searchCommands.reveal();
		const result: Result<void, FileTreeUICommandError> = success<void>(undefined);
		return result;
	}
}
