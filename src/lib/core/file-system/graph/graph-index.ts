import type {
	AtomicPlanPayload,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';

export interface IGraphSnapshot {
	readonly data: unknown;
}

export interface IGraphIndex {
	validateMove(nodeID: NodeID, newParentID: NodeID): Result<void, OperationError>;

	getSubtree(rootID: NodeID): ReadonlyArray<NodeID>;

	getAncestorChain(nodeID: NodeID): Result<ReadonlyArray<NodeID>, OperationError>;

	exists(nodeID: NodeID): boolean;
}

export interface IMutableGraphIndex extends IGraphIndex {
	apply(plans: ReadonlyArray<AtomicPlanPayload>): Result<void, OperationError>;

	exportSnapshot(): Result<IGraphSnapshot, OperationError>;

	restoreSnapshot(snapshot: IGraphSnapshot): Result<void, OperationError>;
}
