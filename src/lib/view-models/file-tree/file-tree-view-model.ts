import type { Readable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { DragStartOutcome } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import type { FileTreeItem } from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IFileTreeViewModel extends IDisposable1 {
	readonly items: Readable<ReadonlyArray<FileTreeItem>>;

	onRowClick(nodeID: NodeID): void;

	onRowDoubleClick(nodeID: NodeID): void;

	onTwistyClick(nodeID: NodeID): void;

	onDragStart(nodeID: NodeID): DragStartOutcome;

	onDragOver(nodeID: NodeID | null): void;

	onDrop(): Promise<void>;

	onDragEnd(): void;
}
