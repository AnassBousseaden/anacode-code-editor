import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { FileTreeFilterResult } from '$lib/core/file-tree-v2/search/filter/file-tree-filter';
import type { FileTreeIndexSnapshot } from '$lib/core/file-tree-v2/search/file-tree-index';

export enum FileTreeSearchMode {
	CONTAINS = 'CONTAINS'
}

export interface FileTreeSearchQuery {
	readonly text: string;
	readonly mode: FileTreeSearchMode;
}

export interface IFileTreeSearchEngine {
	compute(query: FileTreeSearchQuery, snapshot: FileTreeIndexSnapshot): FileTreeFilterResult;
}

export class FileTreeSearchEngine implements IFileTreeSearchEngine {
	compute(query: FileTreeSearchQuery, snapshot: FileTreeIndexSnapshot): FileTreeFilterResult {
		const matchedIDs: ReadonlyArray<NodeID> = snapshot.findBySubstring(query.text);
		const targetNodeIDs: ReadonlySet<NodeID> = new Set<NodeID>(matchedIDs);

		const result: FileTreeFilterResult = {
			targetNodeIDs: targetNodeIDs
		};

		return result;
	}
}
