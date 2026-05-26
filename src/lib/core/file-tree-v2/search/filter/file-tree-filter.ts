import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { Readable } from 'svelte/store';

export interface FileTreeFilterResult {
	readonly targetNodeIDs: ReadonlySet<NodeID>;
}
export interface IFileTreeFilterProvider {
	readonly filterResult: Readable<FileTreeFilterResult | null>;
}
