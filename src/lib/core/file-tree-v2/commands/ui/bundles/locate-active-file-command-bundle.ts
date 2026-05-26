import { derived, get, type Readable } from 'svelte/store';

import type { IObservableEditorIntentState } from '$lib/core/editor/intent/editor-intent-service';
import {
	DocumentStateKind,
	type DocumentState
} from '$lib/core/code-editor/editor-orchestration-models';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import { type Result } from '$lib/core/shared/models-utils';
import {
	type CommandAvailability,
	type EditorSelection,
	EditorSelectionKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type FileTreeUICommandDescriptor,
	type FileTreeUICommandError,
	FileTreeUICommandID,
	type IFileTreeUICommand,
	type LocateActiveFileUICommandResult
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

function extractActiveFileID(state: DocumentState): NodeID | null {
	if (state.kind === DocumentStateKind.NONE) {
		return null;
	}
	return state.nodeID;
}

function buildEditorContext(activeFileID: NodeID | null): FileTreeCommandContext {
	const editorSelection: EditorSelection =
		activeFileID === null
			? { kind: EditorSelectionKind.NONE }
			: { kind: EditorSelectionKind.ACTIVE_FILE, nodeID: activeFileID };
	const commandContext: FileTreeCommandContext = {
		editorSelection: {
			editorSelection: editorSelection
		}
	};
	return commandContext;
}

export class LocateActiveFileUICommandBundle
	implements
		IBundledCommand<FileTreeUICommandID, LocateActiveFileUICommandResult, FileTreeUICommandError>
{
	public readonly descriptor: FileTreeUICommandDescriptor;
	public readonly availability: Readable<CommandAvailability<FileTreeUICommandError>>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeUICommand<LocateActiveFileUICommandResult>;
	private readonly intentState: IObservableEditorIntentState;

	constructor(
		primitive: IFileTreeUICommand<LocateActiveFileUICommandResult>,
		intentState: IObservableEditorIntentState
	) {
		this.primitive = primitive;
		this.intentState = intentState;
		this.descriptor = primitive.descriptor;
		this.availability = this.deriveAvailability();
		this.commandContext = derived(
			this.intentState.activeDocument,
			(state: DocumentState): FileTreeCommandContext => {
				const activeFileID: NodeID | null = extractActiveFileID(state);
				const commandContext: FileTreeCommandContext = buildEditorContext(activeFileID);
				return commandContext;
			}
		);
	}

	public async perform(): Promise<
		Result<LocateActiveFileUICommandResult, FileTreeUICommandError>
	> {
		const state: DocumentState = get(this.intentState.activeDocument);
		const activeFileID: NodeID | null = extractActiveFileID(state);
		const commandContext: FileTreeCommandContext = buildEditorContext(activeFileID);
		const result: Result<LocateActiveFileUICommandResult, FileTreeUICommandError> =
			await this.primitive.perform(commandContext);
		return result;
	}

	public dispose(): void {}

	private deriveAvailability(): Readable<CommandAvailability<FileTreeUICommandError>> {
		const availabilityStore: Readable<CommandAvailability<FileTreeUICommandError>> = derived(
			this.intentState.activeDocument,
			(state: DocumentState): CommandAvailability<FileTreeUICommandError> => {
				const activeFileID: NodeID | null = extractActiveFileID(state);
				const commandContext: FileTreeCommandContext = buildEditorContext(activeFileID);
				const result: CommandAvailability<FileTreeUICommandError> =
					this.primitive.getAvailability(commandContext);
				return result;
			}
		);
		return availabilityStore;
	}
}
