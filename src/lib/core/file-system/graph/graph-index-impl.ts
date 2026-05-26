import Graph from 'graphology';
import type { Attributes, SerializedGraph } from 'graphology-types';
import { hasCycle, willCreateCycle } from 'graphology-dag';
import { dfsFromNode } from 'graphology-traversal';
import type { Result } from '$lib/core/shared/models-utils';
import { failure } from '$lib/core/shared/models-utils';
import {
	type AtomicPlanPayload,
	type FileSystemMapReadonly,
	type FileSystemNode,
	FileSystemPlanType,
	type NodeCreatePlan,
	type NodeDeletePlan,
	type NodeID,
	type NodeMovePlan,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type {
	IGraphSnapshot,
	IMutableGraphIndex
} from '$lib/core/file-system/graph/graph-index';
import { GraphIndexErrorMessages } from '$lib/core/file-system/graph/graph-index-errors';

export class GraphIndex implements IMutableGraphIndex {
	private readonly graph: Graph;
	private readonly nodeIDToKey: StringConstructor = String;

	private constructor() {
		this.graph = new Graph({
			type: 'directed' as const,
			allowSelfLoops: false,
			multi: false
		});
	}

	public static fromState(
		state: FileSystemMapReadonly
	): Result<IMutableGraphIndex, OperationError> {
		const rootNode: FileSystemNode | undefined = state[ROOT_NODE_ID];
		if (rootNode === undefined) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.MISSING_ROOT()
			};
			return { ok: false, error: error };
		}

		const graphIndex: GraphIndex = new GraphIndex();

		const stateKeys: ReadonlyArray<string> = Object.keys(state);
		const nodeIDs: Array<NodeID> = [];

		for (const key of stateKeys) {
			const nodeID: NodeID = Number(key) as NodeID;
			nodeIDs.push(nodeID);
		}

		for (const nodeID of nodeIDs) {
			const nodeKey: string = graphIndex.nodeIDToKey(nodeID);
			graphIndex.graph.addNode(nodeKey);
		}

		for (const nodeID of nodeIDs) {
			const node: FileSystemNode = state[nodeID];
			const parentID: NodeID | null = node.parentID;

			if (parentID === null) {
				continue;
			}

			const parentKey: string = graphIndex.nodeIDToKey(parentID);
			const childKey: string = graphIndex.nodeIDToKey(nodeID);

			const parentExists: boolean = graphIndex.graph.hasNode(parentKey);
			if (!parentExists) {
				const error: OperationError = {
					message: GraphIndexErrorMessages.PARENT_NOT_IN_GRAPH(parentID)
				};
				return { ok: false, error: error };
			}

			graphIndex.graph.addEdge(parentKey, childKey);
		}

		const graphHasCycle: boolean = hasCycle(graphIndex.graph);
		if (graphHasCycle) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.CYCLE_DETECTED()
			};
			return { ok: false, error: error };
		}

		const rootKey: string = graphIndex.nodeIDToKey(ROOT_NODE_ID);
		let reachableCount: number = 0;

		dfsFromNode(graphIndex.graph, rootKey, (): void => {
			reachableCount = reachableCount + 1;
		});

		const totalNodeCount: number = graphIndex.graph.order;
		if (reachableCount !== totalNodeCount) {
			const orphanCount: number = totalNodeCount - reachableCount;
			const error: OperationError = {
				message: GraphIndexErrorMessages.DISCONNECTED_NODES(orphanCount)
			};
			return { ok: false, error: error };
		}

		return { ok: true, value: graphIndex };
	}

	public validateMove(nodeID: NodeID, newParentID: NodeID): Result<void, OperationError> {
		const nodeKey: string = this.nodeIDToKey(nodeID);
		const newParentKey: string = this.nodeIDToKey(newParentID);

		const nodeExists: boolean = this.graph.hasNode(nodeKey);
		if (!nodeExists) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.NODE_NOT_IN_GRAPH(nodeID)
			};
			return { ok: false, error: error };
		}

		const parentExists: boolean = this.graph.hasNode(newParentKey);
		if (!parentExists) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.PARENT_NOT_IN_GRAPH(newParentID)
			};
			return { ok: false, error: error };
		}

		if (nodeID === newParentID) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.MOVE_TO_SELF(nodeID)
			};
			return { ok: false, error: error };
		}

		const wouldCreateCycle: boolean = willCreateCycle(this.graph, newParentKey, nodeKey);
		if (wouldCreateCycle) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.MOVE_TO_DESCENDANT(nodeID, newParentID)
			};
			return { ok: false, error: error };
		}

		return { ok: true, value: undefined };
	}

	public getSubtree(rootID: NodeID): ReadonlyArray<NodeID> {
		const rootKey: string = this.nodeIDToKey(rootID);

		const rootExists: boolean = this.graph.hasNode(rootKey);
		if (!rootExists) {
			const emptyResult: ReadonlyArray<NodeID> = [];
			return emptyResult;
		}

		const result: Array<NodeID> = [];

		dfsFromNode(
			this.graph,
			rootKey,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(nodeKey: string, _attributes: object, _depth: number): void => {
				const currentNodeID: NodeID = this.keyToNodeID(nodeKey);
				result.push(currentNodeID);
			}
		);

		const reversedResult: Array<NodeID> = result.reverse();
		return reversedResult;
	}

	public getAncestorChain(nodeID: NodeID): Result<ReadonlyArray<NodeID>, OperationError> {
		const nodeKey: string = this.nodeIDToKey(nodeID);

		const nodeExists: boolean = this.graph.hasNode(nodeKey);
		if (!nodeExists) {
			const error: OperationError = {
				message: GraphIndexErrorMessages.NODE_NOT_IN_GRAPH(nodeID)
			};
			return { ok: false, error: error };
		}

		const rootKey: string = this.nodeIDToKey(ROOT_NODE_ID);
		const chain: NodeID[] = [];
		let currentKey: string = nodeKey;

		while (currentKey !== rootKey) {
			const currentNodeID: NodeID = this.keyToNodeID(currentKey);
			chain.unshift(currentNodeID);

			const parents: string[] = this.graph.inNeighbors(currentKey);
			const parentCount: number = parents.length;

			if (parentCount === 0) {
				const error: OperationError = {
					message: GraphIndexErrorMessages.NODE_NOT_REACHABLE_FROM_ROOT(currentNodeID)
				};
				return { ok: false, error: error };
			}

			if (parentCount > 1) {
				const error: OperationError = {
					message: GraphIndexErrorMessages.MULTIPLE_PARENTS(currentNodeID, parentCount)
				};
				return { ok: false, error: error };
			}

			currentKey = parents[0];
		}

		chain.unshift(ROOT_NODE_ID);

		return { ok: true, value: chain };
	}

	public exists(nodeID: NodeID): boolean {
		const nodeKey: string = this.nodeIDToKey(nodeID);
		const nodeExists: boolean = this.graph.hasNode(nodeKey);
		return nodeExists;
	}

	public apply(plans: ReadonlyArray<AtomicPlanPayload>): Result<void, OperationError> {
		for (const plan of plans) {
			const applyResult: Result<void, OperationError> = this.applyAtomicPlan(plan);

			if (!applyResult.ok) {
				return applyResult;
			}
		}

		return { ok: true, value: undefined };
	}

	public exportSnapshot(): Result<IGraphSnapshot, OperationError> {
		try {
			const data: SerializedGraph<Attributes, Attributes, Attributes> = this.graph.export();
			return { ok: true, value: { data: data } };
		} catch (error: unknown) {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown graph error';
			return failure({ message: GraphIndexErrorMessages.APPLY_FAILED(errorMessage) });
		}
	}

	public restoreSnapshot(snapshot: IGraphSnapshot): Result<void, OperationError> {
		try {
			const data: SerializedGraph<Attributes, Attributes, Attributes> =
				snapshot.data as SerializedGraph<Attributes, Attributes, Attributes>;
			this.graph.clear();
			this.graph.import(data);
			return { ok: true, value: undefined };
		} catch (error: unknown) {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown graph error';
			return failure({ message: GraphIndexErrorMessages.APPLY_FAILED(errorMessage) });
		}
	}

	private keyToNodeID(key: string): NodeID {
		return Number(key) as NodeID;
	}

	private applyAtomicPlan(plan: AtomicPlanPayload): Result<void, OperationError> {
		switch (plan.type) {
			case FileSystemPlanType.NODE_CREATE:
				this.applyNodeCreate(plan);
				return { ok: true, value: undefined };

			case FileSystemPlanType.NODE_DELETE:
				this.applyNodeDelete(plan);
				return { ok: true, value: undefined };

			case FileSystemPlanType.NODE_MOVE:
				this.applyNodeMove(plan);
				return { ok: true, value: undefined };

			case FileSystemPlanType.NODE_RENAME:
			case FileSystemPlanType.NODE_CONTENT_UPDATED:
				return { ok: true, value: undefined };
		}
	}

	private applyNodeCreate(plan: NodeCreatePlan): void {
		const nodeID: NodeID = plan.node.id;
		const parentID: NodeID | null = plan.node.parentID;

		const nodeKey: string = this.nodeIDToKey(nodeID);

		const nodeExists: boolean = this.graph.hasNode(nodeKey);
		if (!nodeExists) {
			this.graph.addNode(nodeKey);
		}

		if (parentID !== null) {
			const parentKey: string = this.nodeIDToKey(parentID);

			const parentExists: boolean = this.graph.hasNode(parentKey);
			if (!parentExists) {
				this.graph.addNode(parentKey);
			}

			const edgeExists: boolean = this.graph.hasEdge(parentKey, nodeKey);
			if (!edgeExists) {
				this.graph.addEdge(parentKey, nodeKey);
			}
		}
	}

	private applyNodeDelete(plan: NodeDeletePlan): void {
		const nodeID: NodeID = plan.nodeID;
		const nodeKey: string = this.nodeIDToKey(nodeID);

		const nodeExists: boolean = this.graph.hasNode(nodeKey);
		if (nodeExists) {
			this.graph.dropNode(nodeKey);
		}
	}

	private applyNodeMove(plan: NodeMovePlan): void {
		const nodeID: NodeID = plan.nodeID;
		const oldParentID: NodeID = plan.oldParentID;
		const newParentID: NodeID = plan.newParentID;

		const nodeKey: string = this.nodeIDToKey(nodeID);
		const oldParentKey: string = this.nodeIDToKey(oldParentID);
		const newParentKey: string = this.nodeIDToKey(newParentID);

		const oldEdgeExists: boolean = this.graph.hasEdge(oldParentKey, nodeKey);
		if (oldEdgeExists) {
			this.graph.dropEdge(oldParentKey, nodeKey);
		}

		const newParentExists: boolean = this.graph.hasNode(newParentKey);
		if (!newParentExists) {
			this.graph.addNode(newParentKey);
		}

		const newEdgeExists: boolean = this.graph.hasEdge(newParentKey, nodeKey);
		if (!newEdgeExists) {
			this.graph.addEdge(newParentKey, nodeKey);
		}
	}
}
