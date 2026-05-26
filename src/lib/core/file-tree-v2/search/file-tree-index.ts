import type { Readable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface FileTreeIndexSnapshot {
	findBySubstring(text: string): ReadonlyArray<NodeID>;
}

export interface IFileTreeIndex extends IDisposable1 {
	readonly snapshot: Readable<FileTreeIndexSnapshot>;
}
