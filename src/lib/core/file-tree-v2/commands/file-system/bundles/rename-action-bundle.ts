import { derived, get, type Readable } from 'svelte/store';

import type {
	FileSystemMapReadonly,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IObservableFileSystemState } from '$lib/core/file-system/services/file-system-service';
import { failure, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext,
	type InputCommandAvailability
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledInputCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	FileTreeActionID,
	type IFileTreeInputAction,
	type RenameActionInput,
	type RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import type { IObservableFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';

function buildSelectionContext(selectedNodeID: NodeID): FileTreeCommandContext {
	const commandContext: FileTreeCommandContext = {
		fileTreeSelection: {
			selection: [selectedNodeID]
		}
	};
	return commandContext;
}

export class RenameActionBundle
	implements
		IBundledInputCommand<
			FileTreeActionID,
			RenameActionInput,
			RenameActionResult,
			FileTreeActionError
		>
{
	public readonly descriptor: FileTreeActionDescriptor;
	public readonly availability: Readable<
		InputCommandAvailability<RenameActionInput, FileTreeActionError>
	>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeInputAction<RenameActionInput, RenameActionResult>;
	private readonly selectionObservable: IObservableFileTreeSelectionIntent;
	private readonly fsState: IObservableFileSystemState;
	private readonly errorFactory: IFileTreeActionErrorFactory;

	constructor(
		primitive: IFileTreeInputAction<RenameActionInput, RenameActionResult>,
		selectionObservable: IObservableFileTreeSelectionIntent,
		fsState: IObservableFileSystemState,
		errorFactory: IFileTreeActionErrorFactory
	) {
		this.primitive = primitive;
		this.selectionObservable = selectionObservable;
		this.fsState = fsState;
		this.errorFactory = errorFactory;
		this.descriptor = primitive.descriptor;
		this.availability = this.deriveAvailability();
		this.commandContext = derived(
			this.selectionObservable.selectedNodeID,
			(selectedNodeID: NodeID | null): FileTreeCommandContext => ({
				fileTreeSelection: {
					selection: selectedNodeID === null ? [] : [selectedNodeID]
				}
			})
		);
	}

	public canPerform(performInput: RenameActionInput): Result<void, FileTreeActionError> {
		const selectedNodeID: NodeID | null = get(this.selectionObservable.selectedNodeID);
		if (selectedNodeID === null) {
			const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
			const result: Result<void, FileTreeActionError> = failure(error);
			return result;
		}
		const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
		const result: Result<void, FileTreeActionError> = this.primitive.canPerform(
			commandContext,
			performInput
		);
		return result;
	}

	public async perform(
		performInput: RenameActionInput
	): Promise<Result<RenameActionResult, FileTreeActionError>> {
		const selectedNodeID: NodeID | null = get(this.selectionObservable.selectedNodeID);
		if (selectedNodeID === null) {
			const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
			const result: Result<RenameActionResult, FileTreeActionError> = failure(error);
			return result;
		}
		const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
		const result: Result<RenameActionResult, FileTreeActionError> = await this.primitive.perform(
			commandContext,
			performInput
		);
		return result;
	}

	public dispose(): void {}

	private deriveAvailability(): Readable<
		InputCommandAvailability<RenameActionInput, FileTreeActionError>
	> {
		const availabilityStore: Readable<
			InputCommandAvailability<RenameActionInput, FileTreeActionError>
		> = derived(
			[this.selectionObservable.selectedNodeID, this.fsState.fileSystemMap],
			([selectedNodeID, _fsMap]: [
				NodeID | null,
				FileSystemMapReadonly
			]): InputCommandAvailability<RenameActionInput, FileTreeActionError> => {
				if (selectedNodeID === null) {
					const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
					const unavailable: InputCommandAvailability<RenameActionInput, FileTreeActionError> = {
						kind: CommandAvailabilityKind.UNAVAILABLE,
						reason: error
					};
					return unavailable;
				}
				const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
				const result: InputCommandAvailability<RenameActionInput, FileTreeActionError> =
					this.primitive.getAvailability(commandContext);
				return result;
			}
		);
		return availabilityStore;
	}
}
