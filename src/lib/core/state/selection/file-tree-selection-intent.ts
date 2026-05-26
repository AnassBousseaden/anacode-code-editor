import type { Readable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';

/**
 * File-tree selection intent.
 *
 * Records the node the user pointed at in the file tree. This is *intent*,
 * not truth: the referenced node may have been deleted, may not exist yet,
 * or may be otherwise unactionable. Consumers reconcile intent against truth
 * (the file-system service, orchestration state) at action time.
 *
 * The active editor file (truth) lives on
 * `IObservableEditorOrchestrationState.activeDocument`, owned by
 * `EditorOrchestrationService`. These two states are complements, not
 * variants of the same thing.
 */
export interface IObservableFileTreeSelectionIntent {
	readonly selectedNodeID: Readable<NodeID | null>;
}

export interface IFileTreeSelectionIntent extends IObservableFileTreeSelectionIntent {
	select(nodeID: NodeID | null): void;
	getSelected(): NodeID | null;
}
