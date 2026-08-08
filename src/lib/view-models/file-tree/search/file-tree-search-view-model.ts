import type { Readable } from 'svelte/store';

import type { IDisposable1, ITransactionEventSource } from '$lib/core/shared/models-utils';

export enum FileTreeSearchPresentationKind {
	HIDDEN = 'hidden',
	REVEALED = 'revealed'
}

export interface HiddenFileTreeSearchPresentation {
	readonly kind: FileTreeSearchPresentationKind.HIDDEN;
}

export interface RevealedFileTreeSearchPresentation {
	readonly kind: FileTreeSearchPresentationKind.REVEALED;
	readonly query: string;
	readonly placeholder: string;
	readonly dismissLabel: string;
}

export type FileTreeSearchPresentation =
	| HiddenFileTreeSearchPresentation
	| RevealedFileTreeSearchPresentation;

export enum FileTreeSearchKeyOutcomeKind {
	IGNORED = 'ignored',
	HANDLED = 'handled'
}

export interface IgnoredFileTreeSearchKeyOutcome {
	readonly kind: FileTreeSearchKeyOutcomeKind.IGNORED;
}

export interface HandledFileTreeSearchKeyOutcome {
	readonly kind: FileTreeSearchKeyOutcomeKind.HANDLED;
}

export type FileTreeSearchKeyOutcome =
	| IgnoredFileTreeSearchKeyOutcome
	| HandledFileTreeSearchKeyOutcome;

export enum FileTreeSearchViewEventType {
	SEARCH_DID_REQUEST_FOCUS = 'SEARCH_DID_REQUEST_FOCUS'
}

export interface FileTreeSearchViewDidRequestFocusEvent {
	readonly type: FileTreeSearchViewEventType.SEARCH_DID_REQUEST_FOCUS;
}

export type FileTreeSearchViewEvent = FileTreeSearchViewDidRequestFocusEvent;

export interface IFileTreeSearchViewModel
	extends ITransactionEventSource<FileTreeSearchViewEvent>,
		IDisposable1 {
	readonly presentation: Readable<FileTreeSearchPresentation>;

	setQuery(query: string): void;

	dismiss(): void;

	handleKey(key: string): FileTreeSearchKeyOutcome;
}
