import {
	derived,
	get,
	type Readable,
	type Unsubscriber,
	writable,
	type Writable
} from 'svelte/store';

import {
	type FileSystemMapReadonly,
	type FileSystemNode,
	isFolderNode,
	type NodeID,
	NodeType,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import { TreeEngine } from '../tree-engine/tree-engine-impl';
import {
	type FileTreeRow,
	type FolderTreeRow,
	type IFileTree,
	type TreeRow
} from '$lib/core/file-tree-v2/tree/file-tree';
import { SortedTreeGraph } from '../tree-engine/sorted-tree-graph-impl';
import type {
	FlattenedItem,
	ITreeEngine,
	TreeState
} from '$lib/core/file-tree-v2/tree-engine/tree-engine';

export class FileTreeImpl implements IFileTree {
	private readonly _treeState: Writable<TreeState<NodeID>>;
	private readonly _focus: Writable<NodeID | null>;
	private readonly _rows: Readable<ReadonlyArray<TreeRow>>;
	private readonly _expansion: Readable<ReadonlySet<NodeID>>;
	private readonly fileSystemService: IFileSystemService;
	private readonly treeEngine: ITreeEngine<FileSystemNode, NodeID>;
	private readonly treeGraph: SortedTreeGraph;
	private readonly fileSystemMapUnsubscribe: Unsubscriber;

	constructor(fileSystemService: IFileSystemService) {
		this.fileSystemService = fileSystemService;
		this.treeEngine = new TreeEngine<FileSystemNode, NodeID>();
		this.treeGraph = new SortedTreeGraph(fileSystemService, ROOT_NODE_ID);

		const initialExpandedIds: ReadonlySet<NodeID> = new Set<NodeID>([ROOT_NODE_ID]);
		const initialTreeState: TreeState<NodeID> = {
			expandedIds: initialExpandedIds
		};

		this._treeState = writable<TreeState<NodeID>>(initialTreeState);
		this._focus = writable<NodeID | null>(null);

		this.fileSystemMapUnsubscribe = this.fileSystemService.fileSystemMap.subscribe(
			(_fileSystemMap: FileSystemMapReadonly): void => {
				void _fileSystemMap;
				this.reconcileToCurrentFileSystem();
			}
		);

		this._expansion = derived(
			this._treeState,
			(state: TreeState<NodeID>): ReadonlySet<NodeID> => state.expandedIds
		);
		this._rows = derived(this._treeState, (state: TreeState<NodeID>): ReadonlyArray<TreeRow> => {
			const flattened: ReadonlyArray<FlattenedItem<FileSystemNode, NodeID>> =
				this.treeEngine.flatten(state, this.treeGraph);
			const rows: ReadonlyArray<TreeRow> = flattened.map(
				(item: FlattenedItem<FileSystemNode, NodeID>): TreeRow => mapFlattenedItemToTreeRow(item)
			);
			return rows;
		});
	}

	public get rows(): Readable<ReadonlyArray<TreeRow>> {
		return this._rows;
	}

	public get expansion(): Readable<ReadonlySet<NodeID>> {
		return this._expansion;
	}

	public get focus(): Readable<NodeID | null> {
		return this._focus;
	}

	public getSubtreeIDs(folderID: NodeID): ReadonlySet<NodeID> {
		return this.treeEngine.collectSubtreeIDs(folderID, this.treeGraph);
	}

	public flattenWith(expansion: ReadonlySet<NodeID>): ReadonlyArray<TreeRow> {
		const tempState: TreeState<NodeID> = {
			expandedIds: expansion
		};
		const flattened: ReadonlyArray<FlattenedItem<FileSystemNode, NodeID>> =
			this.treeEngine.flatten(tempState, this.treeGraph);
		const rows: ReadonlyArray<TreeRow> = flattened.map(
			(item: FlattenedItem<FileSystemNode, NodeID>): TreeRow => mapFlattenedItemToTreeRow(item)
		);
		return rows;
	}

	public expand(nodeID: NodeID): void {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			return;
		}

		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.expand(nodeID, current, this.treeGraph);
			return next;
		});
	}

	public collapse(nodeID: NodeID): void {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null || !isFolderNode(node)) {
			return;
		}

		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.collapse(nodeID, current, this.treeGraph);
			return next;
		});
	}

	public toggle(nodeID: NodeID): void {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null || !isFolderNode(node)) {
			return;
		}

		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.toggle(nodeID, current, this.treeGraph);
			return next;
		});
	}

	public expandAll(): void {
		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.expandAll(current, this.treeGraph);
			return next;
		});
	}

	public collapseAll(): void {
		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.collapseAll(current, this.treeGraph);
			return next;
		});
	}

	public setFocus(nodeID: NodeID | null): void {
		if (nodeID !== null) {
			const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
			if (node === null) {
				return;
			}
		}

		this._focus.set(nodeID);
	}

	public dispose(): void {
		this.fileSystemMapUnsubscribe();
	}

	private reconcileToCurrentFileSystem(): void {
		this._treeState.update((current: TreeState<NodeID>): TreeState<NodeID> => {
			const next: TreeState<NodeID> = this.treeEngine.reconcile(current, this.treeGraph);
			return next;
		});

		const currentFocus: NodeID | null = get(this._focus);
		if (currentFocus !== null && this.fileSystemService.getNode(currentFocus) === null) {
			this._focus.set(null);
		}
	}
}

function mapFlattenedItemToTreeRow(item: FlattenedItem<FileSystemNode, NodeID>): TreeRow {
	if (isFolderNode(item.data)) {
		const folderRow: FolderTreeRow = {
			type: NodeType.FOLDER,
			node: item.data,
			depth: item.depth,
			isExpanded: item.isExpanded,
			hasChildren: item.hasChildren
		};
		return folderRow;
	}

	const fileRow: FileTreeRow = {
		type: NodeType.FILE,
		node: item.data,
		depth: item.depth
	};
	return fileRow;
}
