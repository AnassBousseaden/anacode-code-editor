import { derived, get, type Readable } from 'svelte/store';

import type {
	FileSystemMapReadonly,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IObservableFileSystemState } from '$lib/core/file-system/services/file-system-service';
import { type Result } from '$lib/core/shared/models-utils';
import {
	type FileTreeCommandContext,
	type InputCommandAvailability
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledInputCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	FileTreeActionID,
	type IFileTreeInputAction
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IObservableFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';

function buildSelectionContext(selectedNodeID: NodeID | null): FileTreeCommandContext {
	const selection: ReadonlyArray<NodeID> = selectedNodeID === null ? [] : [selectedNodeID];
	const commandContext: FileTreeCommandContext = {
		fileTreeSelection: {
			selection: selection
		}
	};
	return commandContext;
}

export class CreateFolderActionBundle
	implements
		IBundledInputCommand<
			FileTreeActionID,
			CreateFolderActionInput,
			CreateFolderActionResult,
			FileTreeActionError
		>
{
	public readonly descriptor: FileTreeActionDescriptor;
	public readonly availability: Readable<
		InputCommandAvailability<CreateFolderActionInput, FileTreeActionError>
	>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeInputAction<
		CreateFolderActionInput,
		CreateFolderActionResult
	>;
	private readonly selectionObservable: IObservableFileTreeSelectionIntent;
	private readonly fsState: IObservableFileSystemState;

	constructor(
		primitive: IFileTreeInputAction<CreateFolderActionInput, CreateFolderActionResult>,
		selectionObservable: IObservableFileTreeSelectionIntent,
		fsState: IObservableFileSystemState
	) {
		this.primitive = primitive;
		this.selectionObservable = selectionObservable;
		this.fsState = fsState;
		this.descriptor = primitive.descriptor;
		this.availability = this.deriveAvailability();
		this.commandContext = derived(
			this.selectionObservable.selectedNodeID,
			(selectedNodeID: NodeID | null): FileTreeCommandContext =>
				buildSelectionContext(selectedNodeID)
		);
	}

	public canPerform(performInput: CreateFolderActionInput): Result<void, FileTreeActionError> {
		const selectedNodeID: NodeID | null = get(this.selectionObservable.selectedNodeID);
		const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
		const result: Result<void, FileTreeActionError> = this.primitive.canPerform(
			commandContext,
			performInput
		);
		return result;
	}

	public async perform(
		performInput: CreateFolderActionInput
	): Promise<Result<CreateFolderActionResult, FileTreeActionError>> {
		const selectedNodeID: NodeID | null = get(this.selectionObservable.selectedNodeID);
		const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
		const result: Result<CreateFolderActionResult, FileTreeActionError> =
			await this.primitive.perform(commandContext, performInput);
		return result;
	}

	public dispose(): void {}

	private deriveAvailability(): Readable<
		InputCommandAvailability<CreateFolderActionInput, FileTreeActionError>
	> {
		const availabilityStore: Readable<
			InputCommandAvailability<CreateFolderActionInput, FileTreeActionError>
		> = derived(
			[this.selectionObservable.selectedNodeID, this.fsState.fileSystemMap],
			([selectedNodeID, _fsMap]: [
				NodeID | null,
				FileSystemMapReadonly
			]): InputCommandAvailability<CreateFolderActionInput, FileTreeActionError> => {
				const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
				const result: InputCommandAvailability<CreateFolderActionInput, FileTreeActionError> =
					this.primitive.getAvailability(commandContext);
				return result;
			}
		);
		return availabilityStore;
	}
}
