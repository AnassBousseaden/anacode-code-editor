import { readable, type Readable } from 'svelte/store';

import { type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type FileTreeUICommandDescriptor,
	type FileTreeUICommandError,
	FileTreeUICommandID,
	type IFileTreeUICommand
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

const EMPTY_COMMAND_CONTEXT: FileTreeCommandContext = {};

export class ExpandAllUICommandBundle
	implements IBundledCommand<FileTreeUICommandID, void, FileTreeUICommandError>
{
	public readonly descriptor: FileTreeUICommandDescriptor;
	public readonly availability: Readable<CommandAvailability<FileTreeUICommandError>>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeUICommand<void>;

	constructor(primitive: IFileTreeUICommand<void>) {
		this.primitive = primitive;
		this.descriptor = primitive.descriptor;
		this.availability = readable<CommandAvailability<FileTreeUICommandError>>({
			kind: CommandAvailabilityKind.AVAILABLE
		});
		this.commandContext = readable<FileTreeCommandContext>(EMPTY_COMMAND_CONTEXT);
	}

	public async perform(): Promise<Result<void, FileTreeUICommandError>> {
		const result: Result<void, FileTreeUICommandError> =
			await this.primitive.perform(EMPTY_COMMAND_CONTEXT);
		return result;
	}

	public dispose(): void {}
}
