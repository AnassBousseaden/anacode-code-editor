import type { Readable } from 'svelte/store';

import {
	NodeType,
	type FileNode,
	type FolderNode,
	type NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface FileTreeRow {
	readonly type: NodeType.FILE;
	readonly node: FileNode;
	readonly depth: number;
}

export interface FolderTreeRow {
	readonly type: NodeType.FOLDER;
	readonly node: FolderNode;
	readonly depth: number;
	readonly isExpanded: boolean;
	readonly hasChildren: boolean;
}

export type TreeRow = FileTreeRow | FolderTreeRow;

export interface IFileTree extends IDisposable1 {
	readonly rows: Readable<ReadonlyArray<TreeRow>>;
	readonly expansion: Readable<ReadonlySet<NodeID>>;
	readonly focus: Readable<NodeID | null>;

	flattenWith(expansion: ReadonlySet<NodeID>): ReadonlyArray<TreeRow>;

	getSubtreeIDs(folderID: NodeID): ReadonlySet<NodeID>;

	expand(nodeID: NodeID): void;

	collapse(nodeID: NodeID): void;

	toggle(nodeID: NodeID): void;

	expandAll(): void;

	collapseAll(): void;

	setFocus(nodeID: NodeID | null): void;
}
