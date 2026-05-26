import type { Readable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileTreeDragState } from '$lib/core/file-tree-v2/drag/file-tree-drag-state';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IFileTreeDragObservable {
	readonly dragState: Readable<IFileTreeDragState | null>;
}

export enum DragStartOutcomeKind {
	STARTED = 'STARTED',
	REJECTED = 'REJECTED'
}

export enum DragStartRejectionReason {
	NOT_DRAGGABLE = 'NOT_DRAGGABLE',
	FOREIGN_USER_SPACE = 'FOREIGN_USER_SPACE',
	READ_ONLY = 'READ_ONLY',
	NO_PARENT = 'NO_PARENT'
}

export interface StartedDragOutcome {
	readonly kind: DragStartOutcomeKind.STARTED;
}

export interface RejectedDragOutcome {
	readonly kind: DragStartOutcomeKind.REJECTED;
	readonly reason: DragStartRejectionReason;
}

export type DragStartOutcome = StartedDragOutcome | RejectedDragOutcome;

export const STARTED_DRAG_OUTCOME: StartedDragOutcome = {
	kind: DragStartOutcomeKind.STARTED
};

export interface IFileTreeDragController extends IFileTreeDragObservable, IDisposable1 {
	startDrag(nodeID: NodeID): DragStartOutcome;

	setHover(nodeID: NodeID | null): void;

	cancel(): void;
}
