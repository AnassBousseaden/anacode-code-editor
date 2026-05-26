import type { Readable } from 'svelte/store';

import type { IDisposable1 } from '$lib/core/shared/models-utils';
import type { IFileTreeFilterProvider } from '$lib/core/file-tree-v2/search/filter/file-tree-filter';

export enum FileTreeSearchStatus {
	IDLE = 'IDLE',
	SEARCHING = 'SEARCHING'
}

export interface IFileTreeSearchService extends IFileTreeFilterProvider, IDisposable1 {
	readonly searchQuery: Readable<string>;
	readonly status: Readable<FileTreeSearchStatus>;
	setSearchQuery(query: string): void;
}
