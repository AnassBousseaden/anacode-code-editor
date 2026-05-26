import { derived, get, type Readable } from 'svelte/store';

import type {
	FileSystemMapReadonly,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IObservableFileSystemState } from '$lib/core/file-system/services/file-system-service';
import { failure, type Result } from '$lib/core/shared/models-utils';
import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import type { IBundledCommand } from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type CopyPathActionResult,
	type FileTreeActionDescriptor,
	type FileTreeActionError,
	FileTreeActionID,
	type IFileTreeAction
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

export class CopyPathActionBundle
	implements IBundledCommand<FileTreeActionID, CopyPathActionResult, FileTreeActionError>
{
	public readonly descriptor: FileTreeActionDescriptor;
	public readonly availability: Readable<CommandAvailability<FileTreeActionError>>;
	public readonly commandContext: Readable<FileTreeCommandContext>;

	private readonly primitive: IFileTreeAction<CopyPathActionResult>;
	private readonly selectionObservable: IObservableFileTreeSelectionIntent;
	private readonly fsState: IObservableFileSystemState;
	private readonly errorFactory: IFileTreeActionErrorFactory;

	constructor(
		primitive: IFileTreeAction<CopyPathActionResult>,
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

	public async perform(): Promise<Result<CopyPathActionResult, FileTreeActionError>> {
		const selectedNodeID: NodeID | null = get(this.selectionObservable.selectedNodeID);
		if (selectedNodeID === null) {
			const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
			const result: Result<CopyPathActionResult, FileTreeActionError> = failure(error);
			return result;
		}
		const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
		const result: Result<CopyPathActionResult, FileTreeActionError> =
			await this.primitive.perform(commandContext);
		return result;
	}

	public dispose(): void {}

	private deriveAvailability(): Readable<CommandAvailability<FileTreeActionError>> {
		const availabilityStore: Readable<CommandAvailability<FileTreeActionError>> = derived(
			[this.selectionObservable.selectedNodeID, this.fsState.fileSystemMap],
			([selectedNodeID, _fsMap]: [
				NodeID | null,
				FileSystemMapReadonly
			]): CommandAvailability<FileTreeActionError> => {
				if (selectedNodeID === null) {
					const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
					const unavailable: CommandAvailability<FileTreeActionError> = {
						kind: CommandAvailabilityKind.UNAVAILABLE,
						reason: error
					};
					return unavailable;
				}
				const commandContext: FileTreeCommandContext = buildSelectionContext(selectedNodeID);
				const result: CommandAvailability<FileTreeActionError> =
					this.primitive.getAvailability(commandContext);
				return result;
			}
		);
		return availabilityStore;
	}
}
