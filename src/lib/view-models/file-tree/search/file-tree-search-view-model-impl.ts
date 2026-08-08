import { derived, type Readable, type Unsubscriber } from 'svelte/store';

import type { EditorMessages } from '$lib/core/localization/localization-models';
import type { TransactionListener } from '$lib/core/shared/models-utils';
import {
	type FileTreeSearchEvent,
	FileTreeSearchEventType,
	type FileTreeSearchVisibility,
	FileTreeSearchVisibilityKind,
	type IFileTreeSearchCommands,
	type IObservableFileTreeSearchState
} from '$lib/core/file-tree-v2/search/file-tree-search-service';
import {
	type FileTreeSearchKeyOutcome,
	FileTreeSearchKeyOutcomeKind,
	type FileTreeSearchPresentation,
	FileTreeSearchPresentationKind,
	type FileTreeSearchViewEvent,
	FileTreeSearchViewEventType,
	type IFileTreeSearchViewModel
} from '$lib/view-models/file-tree/search/file-tree-search-view-model';

const DISMISS_KEY: string = 'Escape';

const HIDDEN_PRESENTATION: FileTreeSearchPresentation = {
	kind: FileTreeSearchPresentationKind.HIDDEN
};

const IGNORED_KEY_OUTCOME: FileTreeSearchKeyOutcome = {
	kind: FileTreeSearchKeyOutcomeKind.IGNORED
};

const HANDLED_KEY_OUTCOME: FileTreeSearchKeyOutcome = {
	kind: FileTreeSearchKeyOutcomeKind.HANDLED
};

const FOCUS_REQUEST_EVENT: FileTreeSearchViewEvent = {
	type: FileTreeSearchViewEventType.SEARCH_DID_REQUEST_FOCUS
};

export class FileTreeSearchViewModelImpl implements IFileTreeSearchViewModel {
	public readonly presentation: Readable<FileTreeSearchPresentation>;

	private readonly searchCommands: IFileTreeSearchCommands;
	private readonly listeners: Set<TransactionListener<FileTreeSearchViewEvent>>;
	private readonly unsubscribeSearchState: Unsubscriber;

	constructor(
		messages: EditorMessages,
		searchState: IObservableFileTreeSearchState,
		searchCommands: IFileTreeSearchCommands
	) {
		this.searchCommands = searchCommands;
		this.listeners = new Set<TransactionListener<FileTreeSearchViewEvent>>();

		const placeholder: string = messages.sideBarSearchPlaceholder;
		const dismissLabel: string = messages.sideBarSearchDismiss;

		this.presentation = derived(
			searchState.visibility,
			(visibility: FileTreeSearchVisibility): FileTreeSearchPresentation => {
				if (visibility.kind === FileTreeSearchVisibilityKind.HIDDEN) {
					return HIDDEN_PRESENTATION;
				}
				const presentation: FileTreeSearchPresentation = {
					kind: FileTreeSearchPresentationKind.REVEALED,
					query: visibility.query,
					placeholder: placeholder,
					dismissLabel: dismissLabel
				};
				return presentation;
			}
		);

		this.unsubscribeSearchState = searchState.onTransaction((event: FileTreeSearchEvent): void => {
			switch (event.type) {
				case FileTreeSearchEventType.SEARCH_DID_REQUEST_FOCUS:
					this.emit(FOCUS_REQUEST_EVENT);
					return;
			}
		});
	}

	public onTransaction(listener: TransactionListener<FileTreeSearchViewEvent>): Unsubscriber {
		this.listeners.add(listener);

		const unsubscriber: Unsubscriber = (): void => {
			this.listeners.delete(listener);
		};

		return unsubscriber;
	}

	public setQuery(query: string): void {
		this.searchCommands.setSearchQuery(query);
	}

	public dismiss(): void {
		this.searchCommands.dismiss();
	}

	public handleKey(key: string): FileTreeSearchKeyOutcome {
		if (key !== DISMISS_KEY) {
			return IGNORED_KEY_OUTCOME;
		}
		this.searchCommands.dismiss();
		return HANDLED_KEY_OUTCOME;
	}

	public dispose(): void {
		this.unsubscribeSearchState();
		this.listeners.clear();
	}

	private emit(event: FileTreeSearchViewEvent): void {
		for (const listener of this.listeners) {
			listener(event);
		}
	}
}
