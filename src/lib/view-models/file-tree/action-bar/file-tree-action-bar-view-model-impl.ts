import { derived, type Readable } from 'svelte/store';

import {
	CommandAvailabilityKind,
	type CommandAvailability,
	type FileTreeCommandContext,
	type InputCommandAvailability
} from '$lib/core/file-tree-v2/commands/command';
import type { ICommandRegistry } from '$lib/core/file-tree-v2/commands/command-registry';
import type {
	IBundledCommand,
	IBundledInputCommand
} from '$lib/core/file-tree-v2/commands/command-bundle';
import {
	type CreateFileActionInput,
	type CreateFileActionResult,
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type DeleteActionResult,
	type FileTreeActionError,
	FileTreeActionID,
	type RenameActionInput,
	type RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import {
	type FileTreeSaveCommandError,
	FileTreeSaveCommandID,
	type SaveAllCommandResult
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import {
	type FileTreeUICommandError,
	FileTreeUICommandID,
	type LocateActiveFileUICommandResult
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';
import { failure, success, type Result } from '$lib/core/shared/models-utils';
import {
	type ActionDialogRequestInput,
	ActionDialogRequestInputKind,
	type CreateFileRequestInput,
	type CreateFolderRequestInput,
	type DeleteRequestInput,
	type IActionDialogRequestController,
	type RenameRequestInput
} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';
import {
	type CollapseNodeUICommandPresentation,
	type CreateFileActionBarPresentation,
	type CreateFolderActionBarPresentation,
	type DeleteActionBarPresentation,
	type ExpandNodeUICommandPresentation,
	type FileTreeActionAccelerator,
	FileTreeActionAcceleratorKind,
	type FileTreeActionAvailability,
	FileTreeActionAvailabilityKind,
	FileTreeActionBarPresentationKind,
	type FileTreeActionIcon,
	FileTreeActionIconKind,
	type FileTreeSaveCommandAvailability,
	FileTreeSaveCommandPresentationKind,
	type FileTreeUICommandAvailability,
	FileTreeUICommandPresentationKind,
	type IFileTreeActionBarViewModel,
	type LocateActiveFileUICommandPresentation,
	type RenameActionBarPresentation,
	type SaveAllSaveCommandPresentation
} from '$lib/view-models/file-tree/action-bar/file-tree-action-bar-view-model';

const CREATE_FILE_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'plus'
};

const CREATE_FOLDER_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'folder-plus'
};

const RENAME_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'pen'
};

const DELETE_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'trash'
};

const EXPAND_NODE_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'chevrons-up-down'
};

const COLLAPSE_NODE_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'chevrons-down-up'
};

const LOCATE_ACTIVE_FILE_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'crosshair'
};

const SAVE_ALL_ICON: FileTreeActionIcon = {
	kind: FileTreeActionIconKind.NAMED,
	name: 'save-all'
};

const NO_ACCELERATOR: FileTreeActionAccelerator = {
	kind: FileTreeActionAcceleratorKind.NONE
};

const RENAME_ACCELERATOR: FileTreeActionAccelerator = {
	kind: FileTreeActionAcceleratorKind.KEY_BINDING,
	keyBinding: 'F2'
};

const DELETE_ACCELERATOR: FileTreeActionAccelerator = {
	kind: FileTreeActionAcceleratorKind.KEY_BINDING,
	keyBinding: 'Delete'
};

function mapInputBundleAvailability<TRequestInput extends ActionDialogRequestInput>(
	bundleAvailability: InputCommandAvailability<unknown, FileTreeActionError>,
	requestInput: TRequestInput
): FileTreeActionAvailability<TRequestInput> {
	if (bundleAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
		const availability: FileTreeActionAvailability<TRequestInput> = {
			kind: FileTreeActionAvailabilityKind.UNAVAILABLE,
			reason: bundleAvailability.reason
		};
		return availability;
	}
	const availability: FileTreeActionAvailability<TRequestInput> = {
		kind: FileTreeActionAvailabilityKind.AVAILABLE,
		requestInput: requestInput
	};
	return availability;
}

function mapCommandBundleAvailability(
	bundleAvailability: CommandAvailability<FileTreeUICommandError>
): FileTreeUICommandAvailability {
	if (bundleAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
		const availability: FileTreeUICommandAvailability = {
			kind: FileTreeActionAvailabilityKind.UNAVAILABLE,
			reason: bundleAvailability.reason
		};
		return availability;
	}
	const availability: FileTreeUICommandAvailability = {
		kind: FileTreeActionAvailabilityKind.AVAILABLE
	};
	return availability;
}

function mapSaveBundleAvailability(
	bundleAvailability: CommandAvailability<FileTreeSaveCommandError>
): FileTreeSaveCommandAvailability {
	if (bundleAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
		const availability: FileTreeSaveCommandAvailability = {
			kind: FileTreeActionAvailabilityKind.UNAVAILABLE,
			reason: bundleAvailability.reason
		};
		return availability;
	}
	const availability: FileTreeSaveCommandAvailability = {
		kind: FileTreeActionAvailabilityKind.AVAILABLE
	};
	return availability;
}

export class FileTreeActionBarViewModelImpl implements IFileTreeActionBarViewModel {
	public readonly createFile: Readable<CreateFileActionBarPresentation>;
	public readonly createFolder: Readable<CreateFolderActionBarPresentation>;
	public readonly rename: Readable<RenameActionBarPresentation>;
	public readonly delete: Readable<DeleteActionBarPresentation>;
	public readonly expandNode: Readable<ExpandNodeUICommandPresentation>;
	public readonly collapseNode: Readable<CollapseNodeUICommandPresentation>;
	public readonly locateActiveFile: Readable<LocateActiveFileUICommandPresentation>;
	public readonly saveAll: Readable<SaveAllSaveCommandPresentation>;

	private readonly commandRegistry: ICommandRegistry;
	private readonly requestController: IActionDialogRequestController;

	constructor(
		commandRegistry: ICommandRegistry,
		requestController: IActionDialogRequestController
	) {
		this.commandRegistry = commandRegistry;
		this.requestController = requestController;

		const createFileBundle: IBundledInputCommand<
			FileTreeActionID,
			CreateFileActionInput,
			CreateFileActionResult,
			FileTreeActionError
		> = this.commandRegistry.getCommand(FileTreeActionID.CREATE_FILE);

		const createFolderBundle: IBundledInputCommand<
			FileTreeActionID,
			CreateFolderActionInput,
			CreateFolderActionResult,
			FileTreeActionError
		> = this.commandRegistry.getCommand(FileTreeActionID.CREATE_FOLDER);

		const renameBundle: IBundledInputCommand<
			FileTreeActionID,
			RenameActionInput,
			RenameActionResult,
			FileTreeActionError
		> = this.commandRegistry.getCommand(FileTreeActionID.RENAME);

		const deleteBundle: IBundledCommand<FileTreeActionID, DeleteActionResult, FileTreeActionError> =
			this.commandRegistry.getCommand(FileTreeActionID.DELETE);

		const expandBundle: IBundledCommand<FileTreeUICommandID, void, FileTreeUICommandError> =
			this.commandRegistry.getCommand(FileTreeUICommandID.EXPAND_NODE);

		const collapseBundle: IBundledCommand<FileTreeUICommandID, void, FileTreeUICommandError> =
			this.commandRegistry.getCommand(FileTreeUICommandID.COLLAPSE_NODE);

		const locateBundle: IBundledCommand<
			FileTreeUICommandID,
			LocateActiveFileUICommandResult,
			FileTreeUICommandError
		> = this.commandRegistry.getCommand(FileTreeUICommandID.LOCATE_ACTIVE_FILE);

		const saveAllBundle: IBundledCommand<
			FileTreeSaveCommandID,
			SaveAllCommandResult,
			FileTreeSaveCommandError
		> = this.commandRegistry.getCommand(FileTreeSaveCommandID.SAVE_ALL);

		this.createFile = derived(
			[createFileBundle.availability, createFileBundle.commandContext],
			([
				bundleAvail,
				commandContext
			]: [
				InputCommandAvailability<CreateFileActionInput, FileTreeActionError>,
				FileTreeCommandContext
			]): CreateFileActionBarPresentation => {
				const requestInput: CreateFileRequestInput = {
					kind: ActionDialogRequestInputKind.CREATE_FILE,
					context: commandContext
				};
				const availability: FileTreeActionAvailability<CreateFileRequestInput> =
					mapInputBundleAvailability(bundleAvail, requestInput);
				const presentation: CreateFileActionBarPresentation = {
					kind: FileTreeActionBarPresentationKind.CREATE_FILE,
					label: createFileBundle.descriptor.label,
					icon: CREATE_FILE_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.createFolder = derived(
			[createFolderBundle.availability, createFolderBundle.commandContext],
			([
				bundleAvail,
				commandContext
			]: [
				InputCommandAvailability<CreateFolderActionInput, FileTreeActionError>,
				FileTreeCommandContext
			]): CreateFolderActionBarPresentation => {
				const requestInput: CreateFolderRequestInput = {
					kind: ActionDialogRequestInputKind.CREATE_FOLDER,
					context: commandContext
				};
				const availability: FileTreeActionAvailability<CreateFolderRequestInput> =
					mapInputBundleAvailability(bundleAvail, requestInput);
				const presentation: CreateFolderActionBarPresentation = {
					kind: FileTreeActionBarPresentationKind.CREATE_FOLDER,
					label: createFolderBundle.descriptor.label,
					icon: CREATE_FOLDER_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.rename = derived(
			[renameBundle.availability, renameBundle.commandContext],
			([
				bundleAvail,
				commandContext
			]: [
				InputCommandAvailability<RenameActionInput, FileTreeActionError>,
				FileTreeCommandContext
			]): RenameActionBarPresentation => {
				const requestInput: RenameRequestInput = {
					kind: ActionDialogRequestInputKind.RENAME,
					context: commandContext
				};
				const availability: FileTreeActionAvailability<RenameRequestInput> =
					mapInputBundleAvailability(bundleAvail, requestInput);
				const presentation: RenameActionBarPresentation = {
					kind: FileTreeActionBarPresentationKind.RENAME,
					label: renameBundle.descriptor.label,
					icon: RENAME_ICON,
					accelerator: RENAME_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.delete = derived(
			[deleteBundle.availability, deleteBundle.commandContext],
			([
				bundleAvail,
				commandContext
			]: [
				CommandAvailability<FileTreeActionError>,
				FileTreeCommandContext
			]): DeleteActionBarPresentation => {
				const requestInput: DeleteRequestInput = {
					kind: ActionDialogRequestInputKind.DELETE,
					context: commandContext
				};
				const availability: FileTreeActionAvailability<DeleteRequestInput> =
					bundleAvail.kind === CommandAvailabilityKind.UNAVAILABLE
						? { kind: FileTreeActionAvailabilityKind.UNAVAILABLE, reason: bundleAvail.reason }
						: { kind: FileTreeActionAvailabilityKind.AVAILABLE, requestInput: requestInput };
				const presentation: DeleteActionBarPresentation = {
					kind: FileTreeActionBarPresentationKind.DELETE,
					label: deleteBundle.descriptor.label,
					icon: DELETE_ICON,
					accelerator: DELETE_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.expandNode = derived(
			expandBundle.availability,
			(bundleAvail: CommandAvailability<FileTreeUICommandError>): ExpandNodeUICommandPresentation => {
				const availability: FileTreeUICommandAvailability =
					mapCommandBundleAvailability(bundleAvail);
				const presentation: ExpandNodeUICommandPresentation = {
					kind: FileTreeUICommandPresentationKind.EXPAND_NODE,
					label: expandBundle.descriptor.label,
					icon: EXPAND_NODE_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.collapseNode = derived(
			collapseBundle.availability,
			(
				bundleAvail: CommandAvailability<FileTreeUICommandError>
			): CollapseNodeUICommandPresentation => {
				const availability: FileTreeUICommandAvailability =
					mapCommandBundleAvailability(bundleAvail);
				const presentation: CollapseNodeUICommandPresentation = {
					kind: FileTreeUICommandPresentationKind.COLLAPSE_NODE,
					label: collapseBundle.descriptor.label,
					icon: COLLAPSE_NODE_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.locateActiveFile = derived(
			locateBundle.availability,
			(
				bundleAvail: CommandAvailability<FileTreeUICommandError>
			): LocateActiveFileUICommandPresentation => {
				const availability: FileTreeUICommandAvailability =
					mapCommandBundleAvailability(bundleAvail);
				const presentation: LocateActiveFileUICommandPresentation = {
					kind: FileTreeUICommandPresentationKind.LOCATE_ACTIVE_FILE,
					label: locateBundle.descriptor.label,
					icon: LOCATE_ACTIVE_FILE_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);

		this.saveAll = derived(
			saveAllBundle.availability,
			(
				bundleAvail: CommandAvailability<FileTreeSaveCommandError>
			): SaveAllSaveCommandPresentation => {
				const availability: FileTreeSaveCommandAvailability =
					mapSaveBundleAvailability(bundleAvail);
				const presentation: SaveAllSaveCommandPresentation = {
					kind: FileTreeSaveCommandPresentationKind.SAVE_ALL,
					label: saveAllBundle.descriptor.label,
					icon: SAVE_ALL_ICON,
					accelerator: NO_ACCELERATOR,
					availability: availability
				};
				return presentation;
			}
		);
	}

	public request(input: ActionDialogRequestInput): Result<void, FileTreeActionError> {
		const result: Result<void, FileTreeActionError> = this.requestController.request(input);
		return result;
	}

	public async expandAll(): Promise<Result<void, FileTreeUICommandError>> {
		const bundle: IBundledCommand<FileTreeUICommandID, void, FileTreeUICommandError> =
			this.commandRegistry.getCommand(FileTreeUICommandID.EXPAND_NODE);
		const result: Result<void, FileTreeUICommandError> = await bundle.perform();
		return result;
	}

	public async collapseAll(): Promise<Result<void, FileTreeUICommandError>> {
		const bundle: IBundledCommand<FileTreeUICommandID, void, FileTreeUICommandError> =
			this.commandRegistry.getCommand(FileTreeUICommandID.COLLAPSE_NODE);
		const result: Result<void, FileTreeUICommandError> = await bundle.perform();
		return result;
	}

	public async triggerSaveAll(): Promise<Result<void, FileTreeSaveCommandError>> {
		const bundle: IBundledCommand<
			FileTreeSaveCommandID,
			SaveAllCommandResult,
			FileTreeSaveCommandError
		> = this.commandRegistry.getCommand(FileTreeSaveCommandID.SAVE_ALL);
		const performResult: Result<SaveAllCommandResult, FileTreeSaveCommandError> =
			await bundle.perform();
		if (!performResult.ok) {
			const result: Result<void, FileTreeSaveCommandError> = failure(performResult.error);
			return result;
		}
		const result: Result<void, FileTreeSaveCommandError> = success<void>(undefined);
		return result;
	}

	public async revealActiveFile(): Promise<Result<void, FileTreeUICommandError>> {
		const bundle: IBundledCommand<
			FileTreeUICommandID,
			LocateActiveFileUICommandResult,
			FileTreeUICommandError
		> = this.commandRegistry.getCommand(FileTreeUICommandID.LOCATE_ACTIVE_FILE);
		const performResult: Result<LocateActiveFileUICommandResult, FileTreeUICommandError> =
			await bundle.perform();
		if (!performResult.ok) {
			const result: Result<void, FileTreeUICommandError> = failure(performResult.error);
			return result;
		}
		const result: Result<void, FileTreeUICommandError> = success<void>(undefined);
		return result;
	}
}
