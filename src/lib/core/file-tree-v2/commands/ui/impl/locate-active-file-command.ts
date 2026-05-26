import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import { failure, success, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type EditorSelection,
	EditorSelectionKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import {
	LOCATE_ACTIVE_FILE_UI_COMMAND_DESCRIPTOR,
	type FileTreeUICommandDescriptor,
	type FileTreeUICommandError,
	type IFileTreeUICommand,
	type LocateActiveFileUICommandResult
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';
import type { IFileTreeUICommandErrorFactory } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command-error-factory';

export class LocateActiveFileCommand implements IFileTreeUICommand<LocateActiveFileUICommandResult> {
	public readonly descriptor: FileTreeUICommandDescriptor;

	private readonly fileTree: IFileTree;
	private readonly commandErrorFactory: IFileTreeUICommandErrorFactory;

	constructor(fileTree: IFileTree, commandErrorFactory: IFileTreeUICommandErrorFactory) {
		this.fileTree = fileTree;
		this.commandErrorFactory = commandErrorFactory;
		this.descriptor = LOCATE_ACTIVE_FILE_UI_COMMAND_DESCRIPTOR;
	}

	public getAvailability(
		commandContext: FileTreeCommandContext
	): CommandAvailability<FileTreeUICommandError> {
		const editorSelection: EditorSelection | undefined =
			commandContext.editorSelection?.editorSelection;
		if (editorSelection === undefined || editorSelection.kind === EditorSelectionKind.NONE) {
			const error: FileTreeUICommandError = this.commandErrorFactory.createMissingActiveFileError();
			const availability: CommandAvailability<FileTreeUICommandError> = {
				kind: CommandAvailabilityKind.UNAVAILABLE,
				reason: error
			};
			return availability;
		}

		const availability: CommandAvailability<FileTreeUICommandError> = {
			kind: CommandAvailabilityKind.AVAILABLE
		};
		return availability;
	}

	public async perform(
		commandContext: FileTreeCommandContext
	): Promise<Result<LocateActiveFileUICommandResult, FileTreeUICommandError>> {
		const editorSelection: EditorSelection | undefined =
			commandContext.editorSelection?.editorSelection;
		if (editorSelection === undefined || editorSelection.kind === EditorSelectionKind.NONE) {
			const error: FileTreeUICommandError = this.commandErrorFactory.createMissingActiveFileError();
			const result: Result<LocateActiveFileUICommandResult, FileTreeUICommandError> =
				failure(error);
			return result;
		}

		const activeFileID: NodeID = editorSelection.nodeID;
		this.fileTree.expand(activeFileID);
		this.fileTree.setFocus(activeFileID);

		const commandResult: LocateActiveFileUICommandResult = {
			locatedNodeID: activeFileID
		};
		const result: Result<LocateActiveFileUICommandResult, FileTreeUICommandError> =
			success(commandResult);
		return result;
	}
}
