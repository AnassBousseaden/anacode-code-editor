import type {
	FlattenedItem,
	ITreeEngine,
	TreeState
} from '$lib/core/file-tree-v2/tree-engine/tree-engine';
import type { ITreeGraph } from '$lib/core/file-tree-v2/tree-engine/sorted-tree-graph';

function getAncestorPath<T, ID>(nodeId: ID, graph: ITreeGraph<T, ID>): ReadonlyArray<ID> {
	const path: ID[] = [];
	let parentId: ID | null = graph.getParent(nodeId);

	while (parentId !== null) {
		path.push(parentId);
		parentId = graph.getParent(parentId);
	}

	return path;
}

function collectSubtreeIDsInto<T, ID>(
	nodeId: ID,
	graph: ITreeGraph<T, ID>,
	result: Set<ID>
): void {
	result.add(nodeId);

	const children: ReadonlyArray<ID> = graph.getChildren(nodeId);
	for (const childId of children) {
		collectSubtreeIDsInto(childId, graph, result);
	}
}

export class TreeEngine<T, ID> implements ITreeEngine<T, ID> {
	reconcile(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		const reconciledExpandedIds: Set<ID> = this.reconcileExpandedIds(state.expandedIds, graph);
		const expandedIdsChanged: boolean = !this.areSetsEqual(state.expandedIds, reconciledExpandedIds);

		if (!expandedIdsChanged) {
			return state;
		}

		return {
			expandedIds: reconciledExpandedIds
		};
	}

	collapse(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		if (!state.expandedIds.has(nodeId)) {
			return state;
		}

		const newExpandedIds: Set<ID> = new Set<ID>();

		for (const id of state.expandedIds) {
			if (id === nodeId || this.isDescendantOf(id, nodeId, graph)) {
				continue;
			}
			newExpandedIds.add(id);
		}

		return this.reconcile({ expandedIds: newExpandedIds }, graph);
	}

	expand(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		const newExpandedIds: Set<ID> = new Set<ID>(state.expandedIds);
		newExpandedIds.add(nodeId);

		const ancestors: ReadonlyArray<ID> = getAncestorPath(nodeId, graph);
		for (const ancestorId of ancestors) {
			newExpandedIds.add(ancestorId);
		}

		return this.reconcile({ expandedIds: newExpandedIds }, graph);
	}

	toggle(nodeId: ID, state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		if (state.expandedIds.has(nodeId)) {
			return this.collapse(nodeId, state, graph);
		}
		return this.expand(nodeId, state, graph);
	}

	expandAll(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		void state;
		const rootId: ID = graph.getRoot();
		const newExpandedIds: ReadonlySet<ID> = this.collectSubtreeIDs(rootId, graph);

		return this.reconcile({ expandedIds: new Set<ID>(newExpandedIds) }, graph);
	}

	collectSubtreeIDs(rootId: ID, graph: ITreeGraph<T, ID>): ReadonlySet<ID> {
		const result: Set<ID> = new Set<ID>();
		collectSubtreeIDsInto(rootId, graph, result);
		return result;
	}

	collapseAll(state: TreeState<ID>, graph: ITreeGraph<T, ID>): TreeState<ID> {
		void state;
		return this.reconcile({ expandedIds: new Set<ID>() }, graph);
	}

	flatten(state: TreeState<ID>, graph: ITreeGraph<T, ID>): ReadonlyArray<FlattenedItem<T, ID>> {
		const result: FlattenedItem<T, ID>[] = [];
		const rootId: ID = graph.getRoot();

		this.flattenNode(rootId, 0, state, graph, result);

		return result;
	}

	private isDescendantOf(nodeId: ID, ancestorId: ID, graph: ITreeGraph<T, ID>): boolean {
		let currentId: ID | null = graph.getParent(nodeId);

		while (currentId !== null) {
			if (currentId === ancestorId) {
				return true;
			}
			currentId = graph.getParent(currentId);
		}

		return false;
	}

	private reconcileExpandedIds(expandedIds: ReadonlySet<ID>, graph: ITreeGraph<T, ID>): Set<ID> {
		const result: Set<ID> = new Set<ID>();

		for (const id of expandedIds) {
			const node: T | null = graph.getNode(id);
			if (node === null) {
				continue;
			}

			result.add(id);
		}

		return result;
	}

	private areSetsEqual(a: ReadonlySet<ID>, b: ReadonlySet<ID>): boolean {
		if (a.size !== b.size) {
			return false;
		}

		for (const id of a) {
			if (!b.has(id)) {
				return false;
			}
		}

		return true;
	}

	private flattenNode(
		nodeId: ID,
		depth: number,
		state: TreeState<ID>,
		graph: ITreeGraph<T, ID>,
		result: FlattenedItem<T, ID>[]
	): void {
		const node: T | null = graph.getNode(nodeId);
		if (node === null) {
			return;
		}

		const children: ReadonlyArray<ID> = graph.getChildren(nodeId);
		const hasChildren: boolean = children.length > 0;
		const isExpanded: boolean = state.expandedIds.has(nodeId);

		result.push({
			data: node,
			id: nodeId,
			depth: depth,
			isExpanded: isExpanded,
			hasChildren: hasChildren
		});

		if (isExpanded) {
			const childDepth: number = depth + 1;
			for (const childId of children) {
				this.flattenNode(childId, childDepth, state, graph, result);
			}
		}
	}
}
