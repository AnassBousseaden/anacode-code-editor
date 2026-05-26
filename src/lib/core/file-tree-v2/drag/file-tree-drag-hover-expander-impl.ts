import { get, type Unsubscriber } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileTreeDragObservable } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import type { IFileTreeDragHoverExpander } from '$lib/core/file-tree-v2/drag/file-tree-drag-hover-expander';
import {
	DropIntentKind,
	type IFileTreeDragState
} from '$lib/core/file-tree-v2/drag/file-tree-drag-state';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';

const AUTO_EXPAND_DELAY_MS: number = 600;

export class FileTreeDragHoverExpanderImpl implements IFileTreeDragHoverExpander {
	private readonly dragObservable: IFileTreeDragObservable;
	private readonly fileTree: IFileTree;
	private readonly dragStateUnsubscriber: Unsubscriber;
	private autoExpandTimer: ReturnType<typeof setTimeout> | null;
	private pendingFolderID: NodeID | null;

	public constructor(dragObservable: IFileTreeDragObservable, fileTree: IFileTree) {
		this.dragObservable = dragObservable;
		this.fileTree = fileTree;
		this.autoExpandTimer = null;
		this.pendingFolderID = null;
		this.dragStateUnsubscriber = dragObservable.dragState.subscribe(
			(dragState: IFileTreeDragState | null) => {
				this.onDragStateChange(dragState);
			}
		);
	}

	public dispose(): void {
		this.dragStateUnsubscriber();
		this.cancelPendingTimer();
	}

	private onDragStateChange(dragState: IFileTreeDragState | null): void {
		if (dragState === null || dragState.intent === null) {
			this.cancelPendingTimer();
			return;
		}

		if (dragState.intent.kind !== DropIntentKind.MOVE_TO) {
			this.cancelPendingTimer();
			return;
		}

		const resolvedFolderID: NodeID = dragState.intent.resolvedFolderID;

		const currentExpansion: ReadonlySet<NodeID> = get(this.fileTree.expansion);

		if (currentExpansion.has(resolvedFolderID)) {
			this.cancelPendingTimer();
			return;
		}

		if (this.pendingFolderID === resolvedFolderID) {
			return;
		}

		this.cancelPendingTimer();
		this.scheduleExpand(resolvedFolderID);
	}

	private scheduleExpand(folderID: NodeID): void {
		this.pendingFolderID = folderID;

		this.autoExpandTimer = setTimeout((): void => {
			this.fileTree.expand(folderID);
			this.autoExpandTimer = null;
			this.pendingFolderID = null;
		}, AUTO_EXPAND_DELAY_MS);
	}

	private cancelPendingTimer(): void {
		if (this.autoExpandTimer !== null) {
			clearTimeout(this.autoExpandTimer);
			this.autoExpandTimer = null;
		}

		this.pendingFolderID = null;
	}
}
