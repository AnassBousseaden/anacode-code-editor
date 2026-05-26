import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IFileTreeDropIntentEvaluator } from '$lib/core/file-tree-v2/drag/file-tree-drop-intent-evaluator';
import {
	DropIntentKind,
	type DropIntent,
	type InvalidDropIntent,
	type MoveToDropIntent
} from '$lib/core/file-tree-v2/drag/file-tree-drag-state';

const INVALID_DROP_INTENT: InvalidDropIntent = { kind: DropIntentKind.INVALID };

export class FileTreeDropIntentEvaluatorImpl implements IFileTreeDropIntentEvaluator {
	private readonly fileSystemService: IFileSystemService;

	public constructor(fileSystemService: IFileSystemService) {
		this.fileSystemService = fileSystemService;
	}

	public evaluate(draggedNodeID: NodeID, hoveredNodeID: NodeID): DropIntent {
		if (hoveredNodeID === draggedNodeID) {
			return INVALID_DROP_INTENT;
		}

		const resolvedFolderID: NodeID = this.fileSystemService.getInsertionParentID(hoveredNodeID);

		const canMove: boolean = this.fileSystemService.canMoveNode(draggedNodeID, resolvedFolderID);

		if (!canMove) {
			return INVALID_DROP_INTENT;
		}

		const moveToIntent: MoveToDropIntent = {
			kind: DropIntentKind.MOVE_TO,
			resolvedFolderID: resolvedFolderID
		};

		return moveToIntent;
	}
}
