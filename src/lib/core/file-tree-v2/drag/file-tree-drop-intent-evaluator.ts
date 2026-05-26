import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { DropIntent } from '$lib/core/file-tree-v2/drag/file-tree-drag-state';

export interface IFileTreeDropIntentEvaluator {
	evaluate(draggedNodeID: NodeID, hoveredNodeID: NodeID): DropIntent;
}
