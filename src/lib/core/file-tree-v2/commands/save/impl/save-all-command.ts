import { failure, success, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type {
	EditorSaveError,
	EditorSaveState,
	IEditorSaveCommand
} from '$lib/core/editor/save/editor-save-service';
import {
	SAVE_ALL_COMMAND_DESCRIPTOR,
	type FileTreeSaveCommandDescriptor,
	type FileTreeSaveCommandError,
	type IFileTreeSaveCommand,
	type SaveAllCommandResult
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import type { IFileTreeSaveCommandErrorFactory } from '$lib/core/file-tree-v2/commands/save/file-tree-save-command-error-factory';

export class SaveAllCommand implements IFileTreeSaveCommand<SaveAllCommandResult> {
	public readonly descriptor: FileTreeSaveCommandDescriptor;

	private readonly editorSaveCommand: IEditorSaveCommand;
	private readonly commandErrorFactory: IFileTreeSaveCommandErrorFactory;

	constructor(
		editorSaveCommand: IEditorSaveCommand,
		commandErrorFactory: IFileTreeSaveCommandErrorFactory
	) {
		this.editorSaveCommand = editorSaveCommand;
		this.commandErrorFactory = commandErrorFactory;
		this.descriptor = SAVE_ALL_COMMAND_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): CommandAvailability<FileTreeSaveCommandError> {
		const editorSaveState: EditorSaveState | undefined = commandContext.editorSaveState;
		if (editorSaveState === undefined || editorSaveState.canSaveAll === false) {
			const error: FileTreeSaveCommandError = this.commandErrorFactory.createActionDisabledError(
				this.descriptor.label
			);
			const unavailable: CommandAvailability<FileTreeSaveCommandError> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return unavailable;
		}

		const available: CommandAvailability<FileTreeSaveCommandError> = {
			kind: CommandAvailabilityKind.AVAILABLE
		};
		return available;
	}

	public async perform(
		commandContext: FileTreeCommandContext
	): Promise<Result<SaveAllCommandResult, FileTreeSaveCommandError>> {
		void commandContext;
		const saveResult: Result<void, EditorSaveError> = await this.editorSaveCommand.saveAll();
		if (!saveResult.ok) {
			const error: FileTreeSaveCommandError = this.commandErrorFactory.createSaveError(
				saveResult.error
			);
			const result: Result<SaveAllCommandResult, FileTreeSaveCommandError> = failure(error);
			return result;
		}
		const commandResult: SaveAllCommandResult = {};
		const result: Result<SaveAllCommandResult, FileTreeSaveCommandError> = success(commandResult);
		return result;
	}
}
