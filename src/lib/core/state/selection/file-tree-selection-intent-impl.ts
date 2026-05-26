import type { Readable, Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';

export class FileTreeSelectionIntentService implements IFileTreeSelectionIntent {
	private readonly _selectedNodeID: Writable<NodeID | null>;

	constructor(initialSelectedNodeID: NodeID | null = null) {
		this._selectedNodeID = writable<NodeID | null>(initialSelectedNodeID);
	}

	get selectedNodeID(): Readable<NodeID | null> {
		return this._selectedNodeID;
	}

	select(nodeID: NodeID | null): void {
		this._selectedNodeID.set(nodeID);
	}

	getSelected(): NodeID | null {
		return get(this._selectedNodeID);
	}
}
