import type { Readable } from 'svelte/store';

import type { IDisposable1, ITransactionEventSource } from '$lib/core/shared/models-utils';
import type { IFileTreeFilterProvider } from '$lib/core/file-tree-v2/search/filter/file-tree-filter';

export enum FileTreeSearchVisibilityKind {
	HIDDEN = 'hidden',
	REVEALED = 'revealed'
}

export interface HiddenFileTreeSearchVisibility {
	readonly kind: FileTreeSearchVisibilityKind.HIDDEN;
}

export interface RevealedFileTreeSearchVisibility {
	readonly kind: FileTreeSearchVisibilityKind.REVEALED;
	readonly query: string;
}

export type FileTreeSearchVisibility =
	| HiddenFileTreeSearchVisibility
	| RevealedFileTreeSearchVisibility;

export enum FileTreeSearchEventType {
	SEARCH_DID_REQUEST_FOCUS = 'SEARCH_DID_REQUEST_FOCUS'
}

export interface FileTreeSearchDidRequestFocusEvent {
	readonly type: FileTreeSearchEventType.SEARCH_DID_REQUEST_FOCUS;
}

export type FileTreeSearchEvent = FileTreeSearchDidRequestFocusEvent;

export interface IObservableFileTreeSearchState
	extends ITransactionEventSource<FileTreeSearchEvent> {
	readonly visibility: Readable<FileTreeSearchVisibility>;
}

export interface IFileTreeSearchCommands {
	reveal(): void;

	dismiss(): void;

	setSearchQuery(query: string): void;
}

export interface IFileTreeSearchService
	extends IFileTreeFilterProvider,
		IObservableFileTreeSearchState,
		IFileTreeSearchCommands,
		IDisposable1 {}
