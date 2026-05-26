import type { Readable, Writable } from 'svelte/store';
import { derived, writable } from 'svelte/store';

import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { FileTreeFilterResult } from '$lib/core/file-tree-v2/search/filter/file-tree-filter';
import type {
	FileTreeIndexSnapshot,
	IFileTreeIndex
} from '$lib/core/file-tree-v2/search/file-tree-index';
import { FileTreeIndex } from '$lib/core/file-tree-v2/search/file-tree-index-impl';
import {
	FileTreeSearchStatus,
	type IFileTreeSearchService
} from '$lib/core/file-tree-v2/search/file-tree-search-service';
import {
	FileTreeSearchEngine,
	FileTreeSearchMode,
	type FileTreeSearchQuery,
	type IFileTreeSearchEngine
} from '$lib/core/file-tree-v2/search/file-tree-search-engine';

export class FileTreeSearchService implements IFileTreeSearchService {
	private readonly _searchQuery: Writable<string>;
	private readonly _filterResult: Readable<FileTreeFilterResult | null>;
	private readonly _status: Readable<FileTreeSearchStatus>;
	private readonly searchEngine: IFileTreeSearchEngine;
	private readonly index: IFileTreeIndex;

	constructor(fileSystemService: IFileSystemService) {
		this._searchQuery = writable<string>('');
		this.searchEngine = new FileTreeSearchEngine();
		this.index = new FileTreeIndex(fileSystemService);

		this._filterResult = derived(
			[this._searchQuery, this.index.snapshot],
			([query, snapshot]: [string, FileTreeIndexSnapshot]): FileTreeFilterResult | null => {
				if (query === '') {
					return null;
				}

				const searchQuery: FileTreeSearchQuery = {
					text: query,
					mode: FileTreeSearchMode.CONTAINS
				};

				return this.searchEngine.compute(searchQuery, snapshot);
			}
		);

		this._status = derived(
			this._filterResult,
			(filterResult: FileTreeFilterResult | null): FileTreeSearchStatus => {
				return filterResult === null ? FileTreeSearchStatus.IDLE : FileTreeSearchStatus.SEARCHING;
			}
		);
	}

	public get searchQuery(): Readable<string> {
		return this._searchQuery;
	}

	public get filterResult(): Readable<FileTreeFilterResult | null> {
		return this._filterResult;
	}

	public get status(): Readable<FileTreeSearchStatus> {
		return this._status;
	}

	setSearchQuery(query: string): void {
		this._searchQuery.set(query);
	}

	dispose(): void {
		this.index.dispose();
	}
}
