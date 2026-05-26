import type { NodeID } from '$lib/core/file-system/domain/file-system-models';

export enum DropIntentKind {
	MOVE_TO = 'MOVE_TO',
	INVALID = 'INVALID'
}

export interface MoveToDropIntent {
	readonly kind: DropIntentKind.MOVE_TO;
	readonly resolvedFolderID: NodeID;
}

export interface InvalidDropIntent {
	readonly kind: DropIntentKind.INVALID;
}

export type DropIntent = MoveToDropIntent | InvalidDropIntent;

export interface IFileTreeDragState {
	readonly draggedNodeID: NodeID;
	readonly hoveredNodeID: NodeID | null;
	readonly intent: DropIntent | null;
}
