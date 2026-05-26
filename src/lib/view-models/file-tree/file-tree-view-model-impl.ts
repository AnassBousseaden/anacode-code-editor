import { derived, get, type Readable } from 'svelte/store';

import {
	NodeType,
	type NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { FileTreeCommandContext } from '$lib/core/file-tree-v2/commands/command';
import {
	type FileTreeActionError,
	FileTreeActionID,
	type IFileTreeInputAction,
	type MoveActionInput,
	type MoveActionResult
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import type { IPrimitiveCommandRegistry } from '$lib/core/file-tree-v2/commands/command-registry';
import type {
	DragStartOutcome,
	IFileTreeDragController
} from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import {
	DropIntentKind,
	type IFileTreeDragState
} from '$lib/core/file-tree-v2/drag/file-tree-drag-state';
import type {
	FileTreeItem,
	IFileTreeProjection
} from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
import type { IFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';
import type { Result } from '$lib/core/shared/models-utils';
import type { IFileTreeViewModel } from '$lib/view-models/file-tree/file-tree-view-model';

export class FileTreeViewModelImpl implements IFileTreeViewModel {
	private readonly fileTree: IFileTree;
	private readonly projection: IFileTreeProjection;
	private readonly selectedNodeWriter: IFileTreeSelectionIntent;
	private readonly intentCommands: IEditorIntentCommands;
	private readonly dragController: IFileTreeDragController;
	private readonly primitiveRegistry: IPrimitiveCommandRegistry;

	private readonly _items: Readable<ReadonlyArray<FileTreeItem>>;

	constructor(
		fileTree: IFileTree,
		projection: IFileTreeProjection,
		selectedNodeWriter: IFileTreeSelectionIntent,
		intentCommands: IEditorIntentCommands,
		dragController: IFileTreeDragController,
		primitiveRegistry: IPrimitiveCommandRegistry
	) {
		this.fileTree = fileTree;
		this.projection = projection;
		this.selectedNodeWriter = selectedNodeWriter;
		this.intentCommands = intentCommands;
		this.dragController = dragController;
		this.primitiveRegistry = primitiveRegistry;

		this._items = derived(
			this.projection.items,
			(items: ReadonlyArray<FileTreeItem>): ReadonlyArray<FileTreeItem> => {
				const visibleItems: ReadonlyArray<FileTreeItem> = items.filter(
					(item: FileTreeItem): boolean => item.isVisible
				);
				return visibleItems;
			}
		);
	}

	public get items(): Readable<ReadonlyArray<FileTreeItem>> {
		return this._items;
	}

	public onRowClick(nodeID: NodeID): void {
		this.selectedNodeWriter.select(nodeID);
		this.fileTree.setFocus(nodeID);
	}

	public onRowDoubleClick(nodeID: NodeID): void {
		const item: FileTreeItem | null = this.findItem(nodeID);
		if (item === null) {
			return;
		}

		if (item.type === NodeType.FOLDER) {
			this.fileTree.toggle(nodeID);
			return;
		}

		void this.intentCommands.open(nodeID);
	}

	public onTwistyClick(nodeID: NodeID): void {
		this.fileTree.toggle(nodeID);
	}

	public onDragStart(nodeID: NodeID): DragStartOutcome {
		return this.dragController.startDrag(nodeID);
	}

	public onDragOver(nodeID: NodeID | null): void {
		this.dragController.setHover(nodeID);
	}

	public async onDrop(): Promise<void> {
		const dragState: IFileTreeDragState | null = get(this.dragController.dragState);
		const performed: boolean = await this.tryPerformMove(dragState);
		void performed;
		this.dragController.cancel();
	}

	public onDragEnd(): void {
		this.dragController.cancel();
	}

	public dispose(): void {}

	private findItem(nodeID: NodeID): FileTreeItem | null {
		const items: ReadonlyArray<FileTreeItem> = get(this.projection.items);
		for (const item of items) {
			if (item.node.id === nodeID) {
				return item;
			}
		}

		return null;
	}

	private async tryPerformMove(dragState: IFileTreeDragState | null): Promise<boolean> {
		if (dragState === null) {
			return false;
		}
		if (dragState.intent === null) {
			return false;
		}
		if (dragState.intent.kind !== DropIntentKind.MOVE_TO) {
			return false;
		}

		const moveAction: IFileTreeInputAction<MoveActionInput, MoveActionResult> =
			this.primitiveRegistry.getPrimitive(FileTreeActionID.MOVE);
		const commandContext: FileTreeCommandContext = {
			fileTreeSelection: {
				selection: [dragState.draggedNodeID]
			}
		};
		const moveInput: MoveActionInput = {
			targetNodeID: dragState.intent.resolvedFolderID
		};
		const result: Result<MoveActionResult, FileTreeActionError> = await moveAction.perform(
			commandContext,
			moveInput
		);
		return result.ok;
	}
}
