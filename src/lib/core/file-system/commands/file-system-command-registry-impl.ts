import type {
	ICommandHandler,
	ICommandRegistry
} from '$lib/core/file-system/commands/file-system-commands';
import {
	CommandType,
	type FileSystemCommand
} from '$lib/core/file-system/domain/file-system-models';
import type { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';
import { CreateFileHandler } from '$lib/core/file-system/commands/handlers/file-system-create-file-command';
import { CreateFolderHandler } from '$lib/core/file-system/commands/handlers/file-system-create-folder-command';
import { DeleteNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-delete-node-command';
import { RenameNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-rename-node-command';
import { MoveNodeHandler } from '$lib/core/file-system/commands/handlers/file-system-move-node-command';
import { UpdateContentHandler } from '$lib/core/file-system/commands/handlers/file-system-update-content-command';
import { UpdateContentIfHandler } from '$lib/core/file-system/commands/handlers/file-system-update-content-if-command';

export class CommandRegistry implements ICommandRegistry {
	private readonly commandRegistry: ReadonlyMap<CommandType, ICommandHandler<FileSystemCommand>>;

	public constructor(nodeFactory: NodeFactory) {
		const createFileHandler: CreateFileHandler = new CreateFileHandler(nodeFactory);
		const createFolderHandler: CreateFolderHandler = new CreateFolderHandler(nodeFactory);
		const deleteNodeHandler: DeleteNodeHandler = new DeleteNodeHandler();
		const renameNodeHandler: RenameNodeHandler = new RenameNodeHandler();
		const moveNodeHandler: MoveNodeHandler = new MoveNodeHandler();
		const updateContentHandler: UpdateContentHandler = new UpdateContentHandler();
		const updateContentIfHandler: UpdateContentIfHandler = new UpdateContentIfHandler();

		const commandRegistry: Map<CommandType, ICommandHandler<FileSystemCommand>> = new Map<
			CommandType,
			ICommandHandler<FileSystemCommand>
		>();

		commandRegistry.set(CommandType.CREATE_FILE, createFileHandler);
		commandRegistry.set(CommandType.CREATE_FOLDER, createFolderHandler);
		commandRegistry.set(CommandType.DELETE_NODE, deleteNodeHandler);
		commandRegistry.set(CommandType.RENAME_NODE, renameNodeHandler);
		commandRegistry.set(CommandType.MOVE_NODE, moveNodeHandler);
		commandRegistry.set(CommandType.UPDATE_CONTENT, updateContentHandler);
		commandRegistry.set(CommandType.UPDATE_CONTENT_IF, updateContentIfHandler);

		this.commandRegistry = commandRegistry;
	}

	public getHandler(type: CommandType): ICommandHandler<FileSystemCommand> | undefined {
		return this.commandRegistry.get(type);
	}
}
