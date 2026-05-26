import type { ITreeGraph } from '$lib/core/file-tree-v2/tree-engine/sorted-tree-graph';

export interface TreeState<ID> {
	readonly expandedIds: ReadonlySet<ID>;
}

export interface FlattenedItem<T, ID> {
	readonly data: T;
	readonly id: ID;
	readonly depth: number;
	readonly isExpanded: boolean;
	readonly hasChildren: boolean;
}

export interface ITreeEngine<T, ID> {
	reconcile(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	collapse(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	expand(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	toggle(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	expandAll(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	collapseAll(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID>;

	flatten(state: TreeState<ID>, graph: ITreeGraph<T, ID>): ReadonlyArray<FlattenedItem<T, ID>>;

	collectSubtreeIDs(rootId: ID, graph: ITreeGraph<T, ID>): ReadonlySet<ID>;
}
