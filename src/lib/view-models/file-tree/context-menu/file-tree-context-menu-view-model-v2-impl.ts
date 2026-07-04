import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import {
	CommandAvailabilityKind,
	type FileTreeCommandContext
} from '$lib/core/file-tree-v2/commands/command';
import {
	type CopyPathActionResult,
	type CreateFileActionInput,
	type CreateFileActionResult,
	type CreateFolderActionInput,
	type CreateFolderActionResult,
	type DeleteActionResult,
	type FileTreeActionError,
	type FileTreeActionAvailability as CommandFileTreeActionAvailability,
	FileTreeActionID,
	type FileTreeInputActionAvailability,
	type IFileTreeAction,
	type IFileTreeInputAction,
	type RenameActionInput,
	type RenameActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import type { IPrimitiveCommandRegistry } from '$lib/core/file-tree-v2/commands/command-registry';
import { NotificationPromptToneKind } from '$lib/core/editor-prompt/editor-prompt';
import type { IEditorNotificationPublisher } from '$lib/core/editor-prompt/editor-prompt-manager';
import type { EditorMessages } from '$lib/core/localization/localization-models';
import type { Result } from '$lib/core/shared/models-utils';
import { resolveFileTreeActionErrorContent } from '$lib/view-models/file-tree/localization/file-tree-action-messages';
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
	AvailableFileTreeContextMenuActionKind,
	type CopyPathContextMenuActionItem,
	type CreateFileContextMenuActionItem,
	type CreateFolderContextMenuActionItem,
	type DeleteContextMenuActionItem,
	type DeliverAvailableFileTreeContextMenuAction,
	type FileTreeContextMenuAccelerator,
	FileTreeContextMenuAcceleratorKind,
	type FileTreeContextMenuActionAvailability,
	FileTreeContextMenuActionAvailabilityKind,
	type FileTreeContextMenuActionItem,
	FileTreeContextMenuActionKind,
	type FileTreeContextMenuCapabilities,
	type FileTreeContextMenuIcon,
	FileTreeContextMenuIconKind,
	type FileTreeContextTarget,
	FileTreeContextTargetKind,
	type IFileTreeContextMenuViewModelV2,
	type PerformAvailableFileTreeContextMenuAction,
	type RenameContextMenuActionItem,
	type UnavailableFileTreeContextMenuAction
} from '$lib/view-models/file-tree/context-menu/file-tree-context-menu-view-model-v2';

const CREATE_FILE_ICON: FileTreeContextMenuIcon = {
	kind: FileTreeContextMenuIconKind.NAMED,
	name: 'plus'
};

const CREATE_FOLDER_ICON: FileTreeContextMenuIcon = {
	kind: FileTreeContextMenuIconKind.NAMED,
	name: 'folder-plus'
};

const RENAME_ICON: FileTreeContextMenuIcon = {
	kind: FileTreeContextMenuIconKind.NAMED,
	name: 'pen'
};

const DELETE_ICON: FileTreeContextMenuIcon = {
	kind: FileTreeContextMenuIconKind.NAMED,
	name: 'trash'
};

const COPY_PATH_ICON: FileTreeContextMenuIcon = {
	kind: FileTreeContextMenuIconKind.NAMED,
	name: 'clipboard-copy'
};

const NO_ACCELERATOR: FileTreeContextMenuAccelerator = {
	kind: FileTreeContextMenuAcceleratorKind.NONE
};

const RENAME_ACCELERATOR: FileTreeContextMenuAccelerator = {
	kind: FileTreeContextMenuAcceleratorKind.KEY_BINDING,
	keyBinding: 'F2'
};

const DELETE_ACCELERATOR: FileTreeContextMenuAccelerator = {
	kind: FileTreeContextMenuAcceleratorKind.KEY_BINDING,
	keyBinding: 'Delete'
};

export class FileTreeContextMenuViewModelV2Impl implements IFileTreeContextMenuViewModelV2 {
	private readonly primitiveRegistry: IPrimitiveCommandRegistry;
	private readonly errorFactory: IFileTreeActionErrorFactory;
	private readonly requestController: IActionDialogRequestController;
	private readonly notificationPublisher: IEditorNotificationPublisher;
	private readonly messages: EditorMessages;

	constructor(
		messages: EditorMessages,
		primitiveRegistry: IPrimitiveCommandRegistry,
		errorFactory: IFileTreeActionErrorFactory,
		requestController: IActionDialogRequestController,
		notificationPublisher: IEditorNotificationPublisher
	) {
		this.primitiveRegistry = primitiveRegistry;
		this.errorFactory = errorFactory;
		this.requestController = requestController;
		this.notificationPublisher = notificationPublisher;
		this.messages = messages;
	}

	public capabilitiesFor(target: FileTreeContextTarget): FileTreeContextMenuCapabilities {
		const targetNodeID: NodeID | null = this.resolveTargetNodeID(target);
		const actions: FileTreeContextMenuActionItem[] = [];

		const createFileActionItem: CreateFileContextMenuActionItem =
			this.buildCreateFileActionItem(targetNodeID);
		actions.push(createFileActionItem);

		const createFolderActionItem: CreateFolderContextMenuActionItem =
			this.buildCreateFolderActionItem(targetNodeID);
		actions.push(createFolderActionItem);

		const renameActionItem: RenameContextMenuActionItem = this.buildRenameActionItem(targetNodeID);
		actions.push(renameActionItem);

		const deleteActionItem: DeleteContextMenuActionItem = this.buildDeleteActionItem(targetNodeID);
		actions.push(deleteActionItem);

		const copyPathActionItem: CopyPathContextMenuActionItem =
			this.buildCopyPathActionItem(targetNodeID);
		actions.push(copyPathActionItem);

		const capabilities: FileTreeContextMenuCapabilities = {
			actions: actions
		};
		return capabilities;
	}

	private resolveTargetNodeID(target: FileTreeContextTarget): NodeID | null {
		switch (target.kind) {
			case FileTreeContextTargetKind.TARGETED: {
				return target.nodeID;
			}
			case FileTreeContextTargetKind.UNTARGETED: {
				return null;
			}
		}
	}

	private buildCreateFileActionItem(targetNodeID: NodeID | null): CreateFileContextMenuActionItem {
		const action: IFileTreeInputAction<CreateFileActionInput, CreateFileActionResult> =
			this.primitiveRegistry.getPrimitive(FileTreeActionID.CREATE_FILE);
		const commandContext: FileTreeCommandContext = this.buildSelectionContext(targetNodeID);
		const requestInput: CreateFileRequestInput = {
			kind: ActionDialogRequestInputKind.CREATE_FILE,
			context: commandContext
		};
		const availability: FileTreeContextMenuActionAvailability = this.buildAvailability(
			action,
			commandContext,
			requestInput
		);

		const actionItem: CreateFileContextMenuActionItem = {
			kind: FileTreeContextMenuActionKind.CREATE_FILE,
			descriptor: action.descriptor,
			icon: CREATE_FILE_ICON,
			accelerator: NO_ACCELERATOR,
			availability: availability
		};
		return actionItem;
	}

	private buildCreateFolderActionItem(
		targetNodeID: NodeID | null
	): CreateFolderContextMenuActionItem {
		const action: IFileTreeInputAction<CreateFolderActionInput, CreateFolderActionResult> =
			this.primitiveRegistry.getPrimitive(FileTreeActionID.CREATE_FOLDER);
		const commandContext: FileTreeCommandContext = this.buildSelectionContext(targetNodeID);
		const requestInput: CreateFolderRequestInput = {
			kind: ActionDialogRequestInputKind.CREATE_FOLDER,
			context: commandContext
		};
		const availability: FileTreeContextMenuActionAvailability = this.buildAvailability(
			action,
			commandContext,
			requestInput
		);

		const actionItem: CreateFolderContextMenuActionItem = {
			kind: FileTreeContextMenuActionKind.CREATE_FOLDER,
			descriptor: action.descriptor,
			icon: CREATE_FOLDER_ICON,
			accelerator: NO_ACCELERATOR,
			availability: availability
		};
		return actionItem;
	}

	private buildRenameActionItem(targetNodeID: NodeID | null): RenameContextMenuActionItem {
		const action: IFileTreeInputAction<RenameActionInput, RenameActionResult> =
			this.primitiveRegistry.getPrimitive(FileTreeActionID.RENAME);
		const availability: FileTreeContextMenuActionAvailability = this.buildNodeRequiredAvailability(
			action,
			targetNodeID,
			(nodeID: NodeID): RenameRequestInput => {
				const commandContext: FileTreeCommandContext = this.buildSelectionContext(nodeID);
				const requestInput: RenameRequestInput = {
					kind: ActionDialogRequestInputKind.RENAME,
					context: commandContext
				};
				return requestInput;
			}
		);

		const actionItem: RenameContextMenuActionItem = {
			kind: FileTreeContextMenuActionKind.RENAME,
			descriptor: action.descriptor,
			icon: RENAME_ICON,
			accelerator: RENAME_ACCELERATOR,
			availability: availability
		};
		return actionItem;
	}

	private buildCopyPathActionItem(targetNodeID: NodeID | null): CopyPathContextMenuActionItem {
		const action: IFileTreeAction<CopyPathActionResult> = this.primitiveRegistry.getPrimitive(
			FileTreeActionID.COPY_PATH
		);
		const availability: FileTreeContextMenuActionAvailability =
			this.buildCopyPathAvailability(action, targetNodeID);

		const actionItem: CopyPathContextMenuActionItem = {
			kind: FileTreeContextMenuActionKind.COPY_PATH,
			descriptor: action.descriptor,
			icon: COPY_PATH_ICON,
			accelerator: NO_ACCELERATOR,
			availability: availability
		};
		return actionItem;
	}

	private buildCopyPathAvailability(
		action: IFileTreeAction<CopyPathActionResult>,
		targetNodeID: NodeID | null
	): FileTreeContextMenuActionAvailability {
		const commandContext: FileTreeCommandContext = this.buildSelectionContext(targetNodeID);
		const commandAvailability: CommandFileTreeActionAvailability =
			action.getAvailability(commandContext);
		if (commandAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const unavailable: UnavailableFileTreeContextMenuAction = this.createUnavailableAvailability(
				commandAvailability.reason
			);
			return unavailable;
		}

		const available: DeliverAvailableFileTreeContextMenuAction = {
			kind: FileTreeContextMenuActionAvailabilityKind.AVAILABLE,
			availableKind: AvailableFileTreeContextMenuActionKind.DELIVER,
			deliver: async (): Promise<void> => {
				const result: Result<CopyPathActionResult, FileTreeActionError> =
					await action.perform(commandContext);
				if (!result.ok) {
					this.notificationPublisher.publish({
						tone: NotificationPromptToneKind.ERROR,
						title: this.messages.fileTreeNotificationCopyFailed,
						content: resolveFileTreeActionErrorContent(this.messages, result.error)
					});
					return;
				}
				await navigator.clipboard.writeText(result.value.copiedPath);
				this.notificationPublisher.publish({
					tone: NotificationPromptToneKind.INFO,
					title: this.messages.fileTreeNotificationPathCopied,
					content: result.value.copiedPath
				});
			}
		};
		return available;
	}

	private buildDeleteActionItem(targetNodeID: NodeID | null): DeleteContextMenuActionItem {
		const action: IFileTreeAction<DeleteActionResult> =
			this.primitiveRegistry.getPrimitive(FileTreeActionID.DELETE);
		const availability: FileTreeContextMenuActionAvailability =
			this.buildImmediateNodeRequiredAvailability(
				action,
				targetNodeID,
				(nodeID: NodeID): DeleteRequestInput => {
					const commandContext: FileTreeCommandContext = this.buildSelectionContext(nodeID);
					const requestInput: DeleteRequestInput = {
						kind: ActionDialogRequestInputKind.DELETE,
						context: commandContext
					};
					return requestInput;
				}
			);

		const actionItem: DeleteContextMenuActionItem = {
			kind: FileTreeContextMenuActionKind.DELETE,
			descriptor: action.descriptor,
			icon: DELETE_ICON,
			accelerator: DELETE_ACCELERATOR,
			availability: availability
		};
		return actionItem;
	}

	private buildAvailability<TPerformInput, TResult>(
		action: IFileTreeInputAction<TPerformInput, TResult>,
		commandContext: FileTreeCommandContext,
		requestInput: ActionDialogRequestInput
	): FileTreeContextMenuActionAvailability {
		const commandAvailability: FileTreeInputActionAvailability<TPerformInput> =
			action.getAvailability(commandContext);
		if (commandAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const availability: UnavailableFileTreeContextMenuAction = this.createUnavailableAvailability(
				commandAvailability.reason
			);
			return availability;
		}

		const availability: PerformAvailableFileTreeContextMenuAction =
			this.createAvailableAvailability(requestInput);
		return availability;
	}

	private buildNodeRequiredAvailability<
		TRequestInput extends ActionDialogRequestInput,
		TPerformInput,
		TResult
	>(
		action: IFileTreeInputAction<TPerformInput, TResult>,
		targetNodeID: NodeID | null,
		createRequestInput: (nodeID: NodeID) => TRequestInput
	): FileTreeContextMenuActionAvailability {
		const commandContext: FileTreeCommandContext = this.buildSelectionContext(targetNodeID);
		const commandAvailability: FileTreeInputActionAvailability<TPerformInput> =
			action.getAvailability(commandContext);
		if (commandAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const availability: UnavailableFileTreeContextMenuAction = this.createUnavailableAvailability(
				commandAvailability.reason
			);
			return availability;
		}

		if (targetNodeID === null) {
			const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
			const availability: UnavailableFileTreeContextMenuAction =
				this.createUnavailableAvailability(error);
			return availability;
		}

		const requestInput: TRequestInput = createRequestInput(targetNodeID);
		const availability: PerformAvailableFileTreeContextMenuAction =
			this.createAvailableAvailability(requestInput);
		return availability;
	}

	private buildImmediateNodeRequiredAvailability<
		TRequestInput extends ActionDialogRequestInput,
		TResult
	>(
		action: IFileTreeAction<TResult>,
		targetNodeID: NodeID | null,
		createRequestInput: (nodeID: NodeID) => TRequestInput
	): FileTreeContextMenuActionAvailability {
		const commandContext: FileTreeCommandContext = this.buildSelectionContext(targetNodeID);
		const commandAvailability: CommandFileTreeActionAvailability =
			action.getAvailability(commandContext);
		if (commandAvailability.kind === CommandAvailabilityKind.UNAVAILABLE) {
			const availability: UnavailableFileTreeContextMenuAction = this.createUnavailableAvailability(
				commandAvailability.reason
			);
			return availability;
		}

		if (targetNodeID === null) {
			const error: FileTreeActionError = this.errorFactory.createMissingSelectionError();
			const availability: UnavailableFileTreeContextMenuAction =
				this.createUnavailableAvailability(error);
			return availability;
		}

		const requestInput: TRequestInput = createRequestInput(targetNodeID);
		const availability: PerformAvailableFileTreeContextMenuAction =
			this.createAvailableAvailability(requestInput);
		return availability;
	}

	private createAvailableAvailability(
		requestInput: ActionDialogRequestInput
	): PerformAvailableFileTreeContextMenuAction {
		const availability: PerformAvailableFileTreeContextMenuAction = {
			kind: FileTreeContextMenuActionAvailabilityKind.AVAILABLE,
			availableKind: AvailableFileTreeContextMenuActionKind.PERFORM,
			perform: (): void => {
				const result: Result<void, FileTreeActionError> =
					this.requestController.request(requestInput);
				if (!result.ok) {
					this.notificationPublisher.publish({
						tone: NotificationPromptToneKind.ERROR,
						title: this.messages.fileTreeNotificationActionFailed,
						content: resolveFileTreeActionErrorContent(this.messages, result.error)
					});
				}
			}
		};
		return availability;
	}

	private createUnavailableAvailability(
		reason: FileTreeActionError
	): UnavailableFileTreeContextMenuAction {
		const availability: UnavailableFileTreeContextMenuAction = {
			kind: FileTreeContextMenuActionAvailabilityKind.UNAVAILABLE,
			reason: reason
		};
		return availability;
	}

	private buildSelectionContext(nodeID: NodeID | null): FileTreeCommandContext {
		const selection: ReadonlyArray<NodeID> = nodeID === null ? [] : [nodeID];
		const commandContext: FileTreeCommandContext = {
			fileTreeSelection: {
				selection: selection
			}
		};
		return commandContext;
	}
}
