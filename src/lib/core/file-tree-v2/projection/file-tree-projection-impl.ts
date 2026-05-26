import { derived, type Readable } from 'svelte/store';

import {
	type FileNode,
	type FolderNode,
	type NodeID,
	NodeType,
	type UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IObservableEditorSaveState } from '$lib/core/editor/save/editor-save-service';
import type { IObservableEditorIntentState } from '$lib/core/editor/intent/editor-intent-service';
import {
	DocumentStateKind,
	type DocumentState
} from '$lib/core/code-editor/editor-orchestration-models';
import type { IObservableFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';
import type { IEditorUserSpaceObservable } from '$lib/core/state/user-space/editor-user-space-state';
import type { IFileTree, TreeRow } from '$lib/core/file-tree-v2/tree/file-tree';
import type {
	FileTreeFilterResult,
	IFileTreeFilterProvider
} from '$lib/core/file-tree-v2/search/filter/file-tree-filter';
import {
	FileSaveStatus,
	type FileTreeItem,
	type FileTreeItemFile,
	type FileTreeItemFolder,
	type IFileTreeProjection
} from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IFileTreeDragObservable } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import {
	DropIntentKind,
	type IFileTreeDragState
} from '$lib/core/file-tree-v2/drag/file-tree-drag-state';

export class FileTreeProjectionImpl implements IFileTreeProjection {
	private readonly fileTree: IFileTree;
	private readonly fileSystemService: IFileSystemService;
	private readonly selectionIntent: IObservableFileTreeSelectionIntent;
	private readonly intentState: IObservableEditorIntentState;
	private readonly userSpaceObservable: IEditorUserSpaceObservable;
	private readonly editorSaveState: IObservableEditorSaveState;
	private readonly filterProvider: IFileTreeFilterProvider;
	private readonly dragObservable: IFileTreeDragObservable;
	private readonly _items: Readable<ReadonlyArray<FileTreeItem>>;

	constructor(
		fileTree: IFileTree,
		fileSystemService: IFileSystemService,
		selectionIntent: IObservableFileTreeSelectionIntent,
		intentState: IObservableEditorIntentState,
		userSpaceObservable: IEditorUserSpaceObservable,
		editorSaveState: IObservableEditorSaveState,
		filterProvider: IFileTreeFilterProvider,
		dragObservable: IFileTreeDragObservable
	) {
		this.fileTree = fileTree;
		this.fileSystemService = fileSystemService;
		this.selectionIntent = selectionIntent;
		this.intentState = intentState;
		this.userSpaceObservable = userSpaceObservable;
		this.editorSaveState = editorSaveState;
		this.filterProvider = filterProvider;
		this.dragObservable = dragObservable;

		const activeFileIDStore: Readable<NodeID | null> = derived(
			this.intentState.activeDocument,
			(state: DocumentState): NodeID | null => {
				if (state.kind === DocumentStateKind.NONE) {
					return null;
				}
				return state.nodeID;
			}
		);

		this._items = derived(
			[
				this.fileTree.rows,
				this.fileTree.expansion,
				this.selectionIntent.selectedNodeID,
				activeFileIDStore,
				this.userSpaceObservable.activeUserSpace,
				this.filterProvider.filterResult,
				this.dragObservable.dragState,
				this.editorSaveState.saveableNodeIDs,
				this.editorSaveState.conflictedNodeIDs,
				this.editorSaveState.invalidNodeIDs
			],
			([
				defaultRows,
				expansion,
				selectedNodeID,
				activeFileID,
				activeUserSpace,
				filterResult,
				dragState,
				saveableNodeIDs,
				conflictedNodeIDs,
				invalidNodeIDs
			]: [
				ReadonlyArray<TreeRow>,
				ReadonlySet<NodeID>,
				NodeID | null,
				NodeID | null,
				UserSpaceTag | null,
				FileTreeFilterResult | null,
				IFileTreeDragState | null,
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>,
				ReadonlyArray<NodeID>
			]): ReadonlyArray<FileTreeItem> => {
				const items: ReadonlyArray<FileTreeItem> = this.buildItemList(
					defaultRows,
					expansion,
					selectedNodeID,
					activeFileID,
					activeUserSpace,
					filterResult,
					dragState,
					saveableNodeIDs,
					conflictedNodeIDs,
					invalidNodeIDs
				);
				return items;
			}
		);
	}

	public get items(): Readable<ReadonlyArray<FileTreeItem>> {
		return this._items;
	}

	public dispose(): void {}

	private buildItemList(
		defaultRows: ReadonlyArray<TreeRow>,
		expansion: ReadonlySet<NodeID>,
		selectedNodeID: NodeID | null,
		activeFileID: NodeID | null,
		activeUserSpace: UserSpaceTag | null,
		filterResult: FileTreeFilterResult | null,
		dragState: IFileTreeDragState | null,
		saveableNodeIDs: ReadonlyArray<NodeID>,
		conflictedNodeIDs: ReadonlyArray<NodeID>,
		invalidNodeIDs: ReadonlyArray<NodeID>
	): ReadonlyArray<FileTreeItem> {
		const dropTargetIDs: ReadonlySet<NodeID> | null = this.resolveDropTargetIDs(dragState);

		if (filterResult === null) {
			const items: ReadonlyArray<FileTreeItem> = defaultRows.map(
				(row: TreeRow): FileTreeItem =>
					mapRowToFileTreeItem(
						row,
						selectedNodeID,
						activeFileID,
						true,
						activeUserSpace,
						dragState,
						dropTargetIDs,
						saveableNodeIDs,
						conflictedNodeIDs,
						invalidNodeIDs
					)
			);
			return items;
		}

		const visibleNodeIDs: Set<NodeID> = this.resolveVisibleNodes(filterResult.targetNodeIDs);
		const augmentedExpansion: Set<NodeID> = new Set<NodeID>([...expansion, ...visibleNodeIDs]);
		const filteredRows: ReadonlyArray<TreeRow> = this.fileTree.flattenWith(augmentedExpansion);

		const items: ReadonlyArray<FileTreeItem> = filteredRows.map(
			(row: TreeRow): FileTreeItem =>
				mapRowToFileTreeItem(
					row,
					selectedNodeID,
					activeFileID,
					visibleNodeIDs.has(row.node.id),
					activeUserSpace,
					dragState,
					dropTargetIDs,
					saveableNodeIDs,
					conflictedNodeIDs,
					invalidNodeIDs
				)
		);
		return items;
	}

	private resolveDropTargetIDs(
		dragState: IFileTreeDragState | null
	): ReadonlySet<NodeID> | null {
		if (dragState === null) {
			return null;
		}
		if (dragState.intent === null) {
			return null;
		}
		if (dragState.intent.kind !== DropIntentKind.MOVE_TO) {
			return null;
		}
		return this.fileTree.getSubtreeIDs(dragState.intent.resolvedFolderID);
	}

	private resolveVisibleNodes(targetNodeIDs: ReadonlySet<NodeID>): Set<NodeID> {
		const visibleNodeIDs: Set<NodeID> = new Set<NodeID>(targetNodeIDs);

		for (const nodeID of targetNodeIDs) {
			const startNode: ReturnType<IFileSystemService['getNode']> =
				this.fileSystemService.getNode(nodeID);
			let parentID: NodeID | null = startNode?.parentID ?? null;

			while (parentID !== null) {
				if (visibleNodeIDs.has(parentID)) {
					break;
				}

				visibleNodeIDs.add(parentID);
				const parentNode: ReturnType<IFileSystemService['getNode']> =
					this.fileSystemService.getNode(parentID);
				parentID = parentNode?.parentID ?? null;
			}
		}

		return visibleNodeIDs;
	}
}

function computeIsForeignUserSpace(
	nodeUserSpace: UserSpaceTag | null,
	activeUserSpace: UserSpaceTag | null
): boolean {
	if (activeUserSpace === null) {
		return false;
	}

	if (nodeUserSpace === null) {
		return false;
	}

	return nodeUserSpace !== activeUserSpace;
}

function computeIsDragged(dragState: IFileTreeDragState | null, nodeID: NodeID): boolean {
	if (dragState === null) {
		return false;
	}

	return dragState.draggedNodeID === nodeID;
}

function computeIsDropTarget(
	dropTargetIDs: ReadonlySet<NodeID> | null,
	nodeID: NodeID
): boolean {
	if (dropTargetIDs === null) {
		return false;
	}

	return dropTargetIDs.has(nodeID);
}

function computeIsInvalidDropTarget(dragState: IFileTreeDragState | null, nodeID: NodeID): boolean {
	if (dragState === null) {
		return false;
	}

	if (dragState.intent === null) {
		return false;
	}

	if (dragState.intent.kind !== DropIntentKind.INVALID) {
		return false;
	}

	return dragState.hoveredNodeID === nodeID;
}

function computeSaveStatus(
	nodeID: NodeID,
	saveableNodeIDs: ReadonlyArray<NodeID>,
	conflictedNodeIDs: ReadonlyArray<NodeID>,
	invalidNodeIDs: ReadonlyArray<NodeID>
): FileSaveStatus {
	if (invalidNodeIDs.includes(nodeID)) {
		return FileSaveStatus.INVALID;
	}

	if (conflictedNodeIDs.includes(nodeID)) {
		return FileSaveStatus.CONFLICTED;
	}

	if (saveableNodeIDs.includes(nodeID)) {
		return FileSaveStatus.SAVEABLE;
	}

	return FileSaveStatus.CLEAN;
}

function mapRowToFileTreeItem(
	row: TreeRow,
	selectedNodeID: NodeID | null,
	activeFileID: NodeID | null,
	isVisible: boolean,
	activeUserSpace: UserSpaceTag | null,
	dragState: IFileTreeDragState | null,
	dropTargetIDs: ReadonlySet<NodeID> | null,
	saveableNodeIDs: ReadonlyArray<NodeID>,
	conflictedNodeIDs: ReadonlyArray<NodeID>,
	invalidNodeIDs: ReadonlyArray<NodeID>
): FileTreeItem {
	const nodeID: NodeID = row.node.id;
	const isForeignUserSpace: boolean = computeIsForeignUserSpace(
		row.node.userSpace,
		activeUserSpace
	);
	const isDragged: boolean = computeIsDragged(dragState, nodeID);
	const isDropTarget: boolean = computeIsDropTarget(dropTargetIDs, nodeID);
	const isInvalidDropTarget: boolean = computeIsInvalidDropTarget(dragState, nodeID);
	const isSelected: boolean = selectedNodeID === nodeID;

	if (row.type === NodeType.FILE) {
		const saveStatus: FileSaveStatus = computeSaveStatus(
			nodeID,
			saveableNodeIDs,
			conflictedNodeIDs,
			invalidNodeIDs
		);
		const fileNode: FileNode = row.node;
		const fileItem: FileTreeItemFile = {
			type: NodeType.FILE,
			node: fileNode,
			depth: row.depth,
			isSelected: isSelected,
			isVisible: isVisible,
			isForeignUserSpace: isForeignUserSpace,
			isDragged: isDragged,
			isDropTarget: isDropTarget,
			isInvalidDropTarget: isInvalidDropTarget,
			isActive: nodeID === activeFileID,
			saveStatus: saveStatus
		};
		return fileItem;
	}

	const folderNode: FolderNode = row.node;
	const folderItem: FileTreeItemFolder = {
		type: NodeType.FOLDER,
		node: folderNode,
		depth: row.depth,
		isSelected: isSelected,
		isVisible: isVisible,
		isForeignUserSpace: isForeignUserSpace,
		isDragged: isDragged,
		isDropTarget: isDropTarget,
		isInvalidDropTarget: isInvalidDropTarget,
		isExpanded: row.isExpanded,
		hasChildren: row.hasChildren
	};
	return folderItem;
}
