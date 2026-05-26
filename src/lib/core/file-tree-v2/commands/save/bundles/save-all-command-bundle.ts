import { derived, get, type Readable } from 'svelte/store';

import { type Result } from '$lib/core/shared/models-utils';
import {
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type FileTreeSaveCommandDescriptor,
	type FileTreeSaveCommandError,
	FileTreeSaveCommandID,
	type IFileTreeSaveCommand,
	type SaveAllCommandResult
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import type {
	EditorSaveState,
	IObservableEditorSaveState
} from '$lib/core/editor/save/editor-save-service';

function buildSaveContext(editorSaveState: EditorSaveState): FileTreeCommandContext {
	const commandContext: FileTreeCommandContext = {
		editorSaveState: editorSaveState
	};
	return commandContext;
}

export class SaveAllCommandBundle
	implements
		IBundledCommand<FileTreeSaveCommandID, SaveAllCommandResult, FileTreeSaveCommandError>
{
	public readonly descriptor: FileTreeSaveCommandDescriptor;
	public readonly availability: Readable<CommandAvailability<FileTreeSaveCommandError>>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeSaveCommand<SaveAllCommandResult>;
	private readonly editorSaveState: IObservableEditorSaveState;

	constructor(
		primitive: IFileTreeSaveCommand<SaveAllCommandResult>,
		editorSaveState: IObservableEditorSaveState
	) {
		this.primitive = primitive;
		this.editorSaveState = editorSaveState;
		this.descriptor = primitive.descriptor;
		this.availability = this.deriveAvailability();
		this.commandContext = derived(
			this.editorSaveState.state,
			(currentState: EditorSaveState): FileTreeCommandContext => buildSaveContext(currentState)
		);
	}

	public async perform(): Promise<Result<SaveAllCommandResult, FileTreeSaveCommandError>> {
		const currentState: EditorSaveState = get(this.editorSaveState.state);
		const commandContext: FileTreeCommandContext = buildSaveContext(currentState);
		const result: Result<SaveAllCommandResult, FileTreeSaveCommandError> =
			await this.primitive.perform(commandContext);
		return result;
	}

	public dispose(): void {}

	private deriveAvailability(): Readable<CommandAvailability<FileTreeSaveCommandError>> {
		const availabilityStore: Readable<CommandAvailability<FileTreeSaveCommandError>> = derived(
			this.editorSaveState.state,
			(currentState: EditorSaveState): CommandAvailability<FileTreeSaveCommandError> => {
				const commandContext: FileTreeCommandContext = buildSaveContext(currentState);
				const result: CommandAvailability<FileTreeSaveCommandError> =
					this.primitive.getAvailability(commandContext);
				return result;
			}
		);
		return availabilityStore;
	}
}
