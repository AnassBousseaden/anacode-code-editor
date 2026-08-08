import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { derived, writable } from 'svelte/store';

import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { TransactionListener } from '$lib/core/shared/models-utils';
import type { FileTreeFilterResult } from '$lib/core/file-tree-v2/search/filter/file-tree-filter';
import type {
	FileTreeIndexSnapshot,
	IFileTreeIndex
} from '$lib/core/file-tree-v2/search/file-tree-index';
import { FileTreeIndex } from '$lib/core/file-tree-v2/search/file-tree-index-impl';
import {
	type FileTreeSearchEvent,
	FileTreeSearchEventType,
	type FileTreeSearchVisibility,
	FileTreeSearchVisibilityKind,
	type IFileTreeSearchService
} from '$lib/core/file-tree-v2/search/file-tree-search-service';
import {
	FileTreeSearchEngine,
	FileTreeSearchMode,
	type FileTreeSearchQuery,
	type IFileTreeSearchEngine
} from '$lib/core/file-tree-v2/search/file-tree-search-engine';

const HIDDEN_VISIBILITY: FileTreeSearchVisibility = {
	kind: FileTreeSearchVisibilityKind.HIDDEN
};

const FOCUS_REQUEST_EVENT: FileTreeSearchEvent = {
	type: FileTreeSearchEventType.SEARCH_DID_REQUEST_FOCUS
};

export class FileTreeSearchService implements IFileTreeSearchService {
	private readonly _visibility: Writable<FileTreeSearchVisibility>;
	private readonly _filterResult: Readable<FileTreeFilterResult | null>;
	private readonly listeners: Set<TransactionListener<FileTreeSearchEvent>>;
	private readonly searchEngine: IFileTreeSearchEngine;
	private readonly index: IFileTreeIndex;

	constructor(fileSystemService: IFileSystemService) {
		this._visibility = writable<FileTreeSearchVisibility>(HIDDEN_VISIBILITY);
		this.listeners = new Set<TransactionListener<FileTreeSearchEvent>>();
		this.searchEngine = new FileTreeSearchEngine();
		this.index = new FileTreeIndex(fileSystemService);

		this._filterResult = derived(
			[this._visibility, this.index.snapshot],
			([visibility, snapshot]: [
				FileTreeSearchVisibility,
				FileTreeIndexSnapshot
			]): FileTreeFilterResult | null => {
				if (visibility.kind === FileTreeSearchVisibilityKind.HIDDEN || visibility.query === '') {
					return null;
				}

				const searchQuery: FileTreeSearchQuery = {
					text: visibility.query,
					mode: FileTreeSearchMode.CONTAINS
				};

				return this.searchEngine.compute(searchQuery, snapshot);
			}
		);
	}

	public get visibility(): Readable<FileTreeSearchVisibility> {
		return this._visibility;
	}

	public get filterResult(): Readable<FileTreeFilterResult | null> {
		return this._filterResult;
	}

	public onTransaction(listener: TransactionListener<FileTreeSearchEvent>): Unsubscriber {
		this.listeners.add(listener);

		const unsubscriber: Unsubscriber = (): void => {
			this.listeners.delete(listener);
		};

		return unsubscriber;
	}

	public reveal(): void {
		this._visibility.update((current: FileTreeSearchVisibility): FileTreeSearchVisibility => {
			if (current.kind === FileTreeSearchVisibilityKind.REVEALED) {
				return current;
			}
			return { kind: FileTreeSearchVisibilityKind.REVEALED, query: '' };
		});
		this.emit(FOCUS_REQUEST_EVENT);
	}

	public dismiss(): void {
		this._visibility.set(HIDDEN_VISIBILITY);
	}

	public setSearchQuery(query: string): void {
		this._visibility.update((current: FileTreeSearchVisibility): FileTreeSearchVisibility => {
			if (current.kind === FileTreeSearchVisibilityKind.HIDDEN) {
				return current;
			}
			return { kind: FileTreeSearchVisibilityKind.REVEALED, query: query };
		});
	}

	public dispose(): void {
		this.listeners.clear();
		this.index.dispose();
	}

	private emit(event: FileTreeSearchEvent): void {
		for (const listener of this.listeners) {
			listener(event);
		}
	}
}
