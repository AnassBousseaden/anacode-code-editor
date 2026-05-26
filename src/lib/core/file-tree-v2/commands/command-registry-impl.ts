import type {
	IEditorSaveCommand,
	IObservableEditorSaveState
} from '$lib/core/editor/save/editor-save-service';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IDisposable1 } from '$lib/core/shared/models-utils';
import {
	type CommandBundleTypeMap,
	type CommandID,
	type ICommandRegistry,
	type IPrimitiveCommandRegistry,
	type PrimitiveCommandTypeMap
} from '$lib/core/file-tree-v2/commands/command-registry';
import { CopyPathActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/copy-path-action-bundle';
import { CreateFileActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/create-file-action-bundle';
import { CreateFolderActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/create-folder-action-bundle';
import { DeleteActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/delete-action-bundle';
import { MoveActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/move-action-bundle';
import { RenameActionBundle } from '$lib/core/file-tree-v2/commands/file-system/bundles/rename-action-bundle';
import { FileTreeActionID } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
import { FileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-error-factory-impl';
import { CopyPathAction } from '$lib/core/file-tree-v2/commands/file-system/impl/copy-path-action';
import { CreateFileAction } from '$lib/core/file-tree-v2/commands/file-system/impl/create-file-action';
import { CreateFolderAction } from '$lib/core/file-tree-v2/commands/file-system/impl/create-folder-action';
import { DeleteAction } from '$lib/core/file-tree-v2/commands/file-system/impl/delete-action';
import { MoveAction } from '$lib/core/file-tree-v2/commands/file-system/impl/move-action';
import { RenameAction } from '$lib/core/file-tree-v2/commands/file-system/impl/rename-action';
import { SaveAllCommandBundle } from '$lib/core/file-tree-v2/commands/save/bundles/save-all-command-bundle';
import { FileTreeSaveCommandID } from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import { FileTreeSaveCommandErrorFactory } from '$lib/core/file-tree-v2/commands/save/impl/file-tree-save-command-error-factory-impl';
import { SaveAllCommand } from '$lib/core/file-tree-v2/commands/save/impl/save-all-command';
import { CollapseAllUICommandBundle } from '$lib/core/file-tree-v2/commands/ui/bundles/collapse-all-command-bundle';
import { ExpandAllUICommandBundle } from '$lib/core/file-tree-v2/commands/ui/bundles/expand-all-command-bundle';
import { LocateActiveFileUICommandBundle } from '$lib/core/file-tree-v2/commands/ui/bundles/locate-active-file-command-bundle';
import { FileTreeUICommandID } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';
import type { IFileTreeUICommandErrorFactory } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command-error-factory';
import { CollapseCommand } from '$lib/core/file-tree-v2/commands/ui/impl/collapse-command';
import { ExpandCommand } from '$lib/core/file-tree-v2/commands/ui/impl/expand-command';
import { LocateActiveFileCommand } from '$lib/core/file-tree-v2/commands/ui/impl/locate-active-file-command';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import type {
	IEditorIntentCommands,
	IObservableEditorIntentState
} from '$lib/core/editor/intent/editor-intent-service';
import type { IObservableFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';

type BundleRegistryEntries = {
	readonly [K in CommandID]: CommandBundleTypeMap[K];
};

type PrimitiveRegistryEntries = {
	readonly [K in CommandID]: PrimitiveCommandTypeMap[K];
};

export class CommandRegistryImpl implements ICommandRegistry, IPrimitiveCommandRegistry {
	private readonly bundles: BundleRegistryEntries;
	private readonly primitives: PrimitiveRegistryEntries;
	private readonly disposables: ReadonlyArray<IDisposable1>;

	constructor(
		fileTree: IFileTree,
		fileSystemService: IFileSystemService,
		selectionIntent: IObservableFileTreeSelectionIntent,
		intentState: IObservableEditorIntentState,
		intentCommands: IEditorIntentCommands,
		uiCommandErrorFactory: IFileTreeUICommandErrorFactory,
		editorSaveCommand: IEditorSaveCommand,
		editorSaveState: IObservableEditorSaveState
	) {
		const actionErrorFactory: IFileTreeActionErrorFactory = new FileTreeActionErrorFactory();

		const createFileAction: CreateFileAction = new CreateFileAction(
			fileSystemService,
			actionErrorFactory
		);
		const createFolderAction: CreateFolderAction = new CreateFolderAction(
			fileSystemService,
			actionErrorFactory
		);
		const renameAction: RenameAction = new RenameAction(fileSystemService, actionErrorFactory);
		const deleteAction: DeleteAction = new DeleteAction(
			fileSystemService,
			actionErrorFactory,
			intentCommands
		);
		const copyPathAction: CopyPathAction = new CopyPathAction(
			fileSystemService,
			actionErrorFactory
		);
		const moveAction: MoveAction = new MoveAction(fileSystemService, actionErrorFactory);

		const expandCommand: ExpandCommand = new ExpandCommand(fileTree);
		const collapseCommand: CollapseCommand = new CollapseCommand(fileTree);
		const locateActiveFileCommand: LocateActiveFileCommand = new LocateActiveFileCommand(
			fileTree,
			uiCommandErrorFactory
		);

		const saveCommandErrorFactory: FileTreeSaveCommandErrorFactory =
			new FileTreeSaveCommandErrorFactory();
		const saveAllCommand: SaveAllCommand = new SaveAllCommand(
			editorSaveCommand,
			saveCommandErrorFactory
		);

		const primitives: PrimitiveRegistryEntries = {
			[FileTreeActionID.CREATE_FILE]: createFileAction,
			[FileTreeActionID.CREATE_FOLDER]: createFolderAction,
			[FileTreeActionID.RENAME]: renameAction,
			[FileTreeActionID.DELETE]: deleteAction,
			[FileTreeActionID.COPY_PATH]: copyPathAction,
			[FileTreeActionID.MOVE]: moveAction,
			[FileTreeUICommandID.EXPAND_NODE]: expandCommand,
			[FileTreeUICommandID.COLLAPSE_NODE]: collapseCommand,
			[FileTreeUICommandID.LOCATE_ACTIVE_FILE]: locateActiveFileCommand,
			[FileTreeSaveCommandID.SAVE_ALL]: saveAllCommand
		};
		this.primitives = primitives;

		const createFileBundle: CreateFileActionBundle = new CreateFileActionBundle(
			createFileAction,
			selectionIntent,
			fileSystemService
		);
		const createFolderBundle: CreateFolderActionBundle = new CreateFolderActionBundle(
			createFolderAction,
			selectionIntent,
			fileSystemService
		);
		const renameBundle: RenameActionBundle = new RenameActionBundle(
			renameAction,
			selectionIntent,
			fileSystemService,
			actionErrorFactory
		);
		const deleteBundle: DeleteActionBundle = new DeleteActionBundle(
			deleteAction,
			selectionIntent,
			fileSystemService,
			actionErrorFactory
		);
		const copyPathBundle: CopyPathActionBundle = new CopyPathActionBundle(
			copyPathAction,
			selectionIntent,
			fileSystemService,
			actionErrorFactory
		);
		const moveBundle: MoveActionBundle = new MoveActionBundle(
			moveAction,
			selectionIntent,
			fileSystemService,
			actionErrorFactory
		);

		const expandBundle: ExpandAllUICommandBundle = new ExpandAllUICommandBundle(expandCommand);
		const collapseBundle: CollapseAllUICommandBundle = new CollapseAllUICommandBundle(
			collapseCommand
		);
		const locateBundle: LocateActiveFileUICommandBundle = new LocateActiveFileUICommandBundle(
			locateActiveFileCommand,
			intentState
		);

		const saveAllBundle: SaveAllCommandBundle = new SaveAllCommandBundle(
			saveAllCommand,
			editorSaveState
		);

		const bundles: BundleRegistryEntries = {
			[FileTreeActionID.CREATE_FILE]: createFileBundle,
			[FileTreeActionID.CREATE_FOLDER]: createFolderBundle,
			[FileTreeActionID.RENAME]: renameBundle,
			[FileTreeActionID.DELETE]: deleteBundle,
			[FileTreeActionID.COPY_PATH]: copyPathBundle,
			[FileTreeActionID.MOVE]: moveBundle,
			[FileTreeUICommandID.EXPAND_NODE]: expandBundle,
			[FileTreeUICommandID.COLLAPSE_NODE]: collapseBundle,
			[FileTreeUICommandID.LOCATE_ACTIVE_FILE]: locateBundle,
			[FileTreeSaveCommandID.SAVE_ALL]: saveAllBundle
		};
		this.bundles = bundles;

		const disposables: ReadonlyArray<IDisposable1> = [
			createFileBundle,
			createFolderBundle,
			renameBundle,
			deleteBundle,
			copyPathBundle,
			moveBundle,
			expandBundle,
			collapseBundle,
			locateBundle,
			saveAllBundle
		];
		this.disposables = disposables;
	}

	public getCommand<K extends CommandID>(commandID: K): CommandBundleTypeMap[K] {
		const bundle: CommandBundleTypeMap[K] = this.bundles[commandID];
		return bundle;
	}

	public getPrimitive<K extends CommandID>(commandID: K): PrimitiveCommandTypeMap[K] {
		const primitive: PrimitiveCommandTypeMap[K] = this.primitives[commandID];
		return primitive;
	}

	public dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
	}
}
