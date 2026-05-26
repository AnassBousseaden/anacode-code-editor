import { derived, type Readable, type Unsubscriber, writable, type Writable } from 'svelte/store';

import {
	type FileSystemMapReadonly,
	type FileSystemNode,
	type NodeID,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IFileTreeDropIntentEvaluator } from '$lib/core/file-tree-v2/drag/file-tree-drop-intent-evaluator';
import {
	type DragStartOutcome,
	DragStartOutcomeKind,
	DragStartRejectionReason,
	type IFileTreeDragController,
	type RejectedDragOutcome,
	STARTED_DRAG_OUTCOME
} from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import {
	type DropIntent,
	DropIntentKind,
	type IFileTreeDragState
} from '$lib/core/file-tree-v2/drag/file-tree-drag-state';

function areDragStatesEqual(
	firstState: IFileTreeDragState | null,
	secondState: IFileTreeDragState | null
): boolean {
	if (firstState === null && secondState === null) {
		return true;
	}

	if (firstState === null || secondState === null) {
		return false;
	}

	if (firstState.draggedNodeID !== secondState.draggedNodeID) {
		return false;
	}

	if (firstState.hoveredNodeID !== secondState.hoveredNodeID) {
		return false;
	}

	if (firstState.intent === null && secondState.intent === null) {
		return true;
	}

	if (firstState.intent === null || secondState.intent === null) {
		return false;
	}

	if (firstState.intent.kind !== secondState.intent.kind) {
		return false;
	}

	if (
		firstState.intent.kind === DropIntentKind.MOVE_TO &&
		secondState.intent.kind === DropIntentKind.MOVE_TO
	) {
		return firstState.intent.resolvedFolderID === secondState.intent.resolvedFolderID;
	}

	return true;
}

export class FileTreeDragControllerImpl implements IFileTreeDragController {
	private readonly fileSystemService: IFileSystemService;
	private readonly evaluator: IFileTreeDropIntentEvaluator;
	private readonly _dragState: Writable<IFileTreeDragState | null>;
	private readonly dragStateReadable: Readable<IFileTreeDragState | null>;
	private readonly fileSystemMapUnsubscriber: Unsubscriber;

	public constructor(
		fileSystemService: IFileSystemService,
		evaluator: IFileTreeDropIntentEvaluator
	) {
		this.fileSystemService = fileSystemService;
		this.evaluator = evaluator;
		this._dragState = writable<IFileTreeDragState | null>(null);
		this.dragStateReadable = derived(
			this._dragState,
			(dragState: IFileTreeDragState | null) => dragState
		);
		this.fileSystemMapUnsubscriber = fileSystemService.fileSystemMap.subscribe(
			(fileSystemMap: FileSystemMapReadonly) => {
				this.onFileSystemMapChange(fileSystemMap);
			}
		);
	}

	public get dragState(): Readable<IFileTreeDragState | null> {
		return this.dragStateReadable;
	}

	public startDrag(nodeID: NodeID): DragStartOutcome {
		if (nodeID === ROOT_NODE_ID) {
			const rejection: RejectedDragOutcome = {
				kind: DragStartOutcomeKind.REJECTED,
				reason: DragStartRejectionReason.NO_PARENT
			};
			return rejection;
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);

		if (node === null) {
			const rejection: RejectedDragOutcome = {
				kind: DragStartOutcomeKind.REJECTED,
				reason: DragStartRejectionReason.NOT_DRAGGABLE
			};
			return rejection;
		}

		if (node.parentID === null) {
			const rejection: RejectedDragOutcome = {
				kind: DragStartOutcomeKind.REJECTED,
				reason: DragStartRejectionReason.NO_PARENT
			};
			return rejection;
		}

		if (node.userSpace !== null) {
			const rejection: RejectedDragOutcome = {
				kind: DragStartOutcomeKind.REJECTED,
				reason: DragStartRejectionReason.FOREIGN_USER_SPACE
			};
			return rejection;
		}

		if (!node.permissions.write) {
			const rejection: RejectedDragOutcome = {
				kind: DragStartOutcomeKind.REJECTED,
				reason: DragStartRejectionReason.READ_ONLY
			};
			return rejection;
		}

		const initialState: IFileTreeDragState = {
			draggedNodeID: nodeID,
			hoveredNodeID: null,
			intent: null
		};

		this._dragState.set(initialState);

		return STARTED_DRAG_OUTCOME;
	}

	public setHover(nodeID: NodeID | null): void {
		const currentState: IFileTreeDragState | null = this.getCurrentState();

		if (currentState === null) {
			return;
		}

		let nextState: IFileTreeDragState;

		if (nodeID === null) {
			nextState = {
				draggedNodeID: currentState.draggedNodeID,
				hoveredNodeID: null,
				intent: null
			};
		} else {
			const intent: DropIntent = this.evaluator.evaluate(currentState.draggedNodeID, nodeID);

			nextState = {
				draggedNodeID: currentState.draggedNodeID,
				hoveredNodeID: nodeID,
				intent: intent
			};
		}

		if (!areDragStatesEqual(currentState, nextState)) {
			this._dragState.set(nextState);
		}
	}

	public cancel(): void {
		this._dragState.set(null);
	}

	public dispose(): void {
		this.fileSystemMapUnsubscriber();
	}

	private getCurrentState(): IFileTreeDragState | null {
		let currentState: IFileTreeDragState | null = null;

		const unsubscribe: Unsubscriber = this._dragState.subscribe(
			(state: IFileTreeDragState | null) => {
				currentState = state;
			}
		);

		unsubscribe();

		return currentState;
	}

	private onFileSystemMapChange(fileSystemMap: FileSystemMapReadonly): void {
		const currentState: IFileTreeDragState | null = this.getCurrentState();

		if (currentState === null) {
			return;
		}

		const draggedNodeStillExists: boolean = fileSystemMap[currentState.draggedNodeID] !== undefined;

		if (!draggedNodeStillExists) {
			this._dragState.set(null);
			return;
		}

		if (currentState.hoveredNodeID === null) {
			return;
		}

		const hoveredNodeStillExists: boolean = fileSystemMap[currentState.hoveredNodeID] !== undefined;

		if (!hoveredNodeStillExists) {
			const clearedHoverState: IFileTreeDragState = {
				draggedNodeID: currentState.draggedNodeID,
				hoveredNodeID: null,
				intent: null
			};

			this._dragState.set(clearedHoverState);
			return;
		}

		const reEvaluatedIntent: DropIntent = this.evaluator.evaluate(
			currentState.draggedNodeID,
			currentState.hoveredNodeID
		);

		const reEvaluatedState: IFileTreeDragState = {
			draggedNodeID: currentState.draggedNodeID,
			hoveredNodeID: currentState.hoveredNodeID,
			intent: reEvaluatedIntent
		};

		if (!areDragStatesEqual(currentState, reEvaluatedState)) {
			this._dragState.set(reEvaluatedState);
		}
	}
}
