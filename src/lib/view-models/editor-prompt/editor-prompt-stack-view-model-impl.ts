import { type Readable, type Unsubscriber, type Writable, writable } from 'svelte/store';

import type { EditorPromptAction } from '$lib/view-models/editor-prompt/editor-prompt-action';
import {
	ConflictPromptActionKind,
	GenericPromptActionKind,
	InvalidDocumentActionKind
} from '$lib/view-models/editor-prompt/editor-prompt-action';
import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
import type {
	EditorPromptViewItem,
	FailedConflictResolutionPromptViewItem,
	FailedInvalidDocumentPromptViewItem,
	NotificationPromptViewItem,
	PendingConflictResolutionPromptViewItem,
	PendingInvalidDocumentPromptViewItem,
	PromptActionViewItem
} from '$lib/view-models/editor-prompt/editor-prompt-view-state';
import {
	ConflictPromptViewItemStateKind,
	EditorPromptViewItemKind,
	InvalidDocumentPromptViewItemStateKind,
	NotificationPromptViewItemToneKind,
	PromptActionState
} from '$lib/view-models/editor-prompt/editor-prompt-view-state';
import type {
	ConflictResolutionPrompt,
	EditorPrompt,
	EditorPromptID,
	InvalidDocumentPrompt,
	NotificationPrompt
} from '$lib/core/editor-prompt/editor-prompt';
import {
	ConflictPromptStatusKind,
	ConflictResolutionStrategy,
	EditorPromptKind,
	InvalidDocumentPromptStatusKind,
	NotificationPromptToneKind
} from '$lib/core/editor-prompt/editor-prompt';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';

export class EditorPromptStackViewModel implements IEditorPromptStackViewModel {
	public readonly visiblePrompts: Readable<ReadonlyArray<EditorPromptViewItem>>;
	public readonly hiddenCount: Readable<number>;

	private readonly manager: IEditorPromptManager;
	private readonly visiblePromptsStore: Writable<ReadonlyArray<EditorPromptViewItem>>;
	private readonly hiddenCountStore: Writable<number>;
	private readonly promptsUnsubscribe: Unsubscriber;

	public constructor(manager: IEditorPromptManager) {
		this.manager = manager;
		this.visiblePromptsStore = writable<ReadonlyArray<EditorPromptViewItem>>([]);
		this.hiddenCountStore = writable<number>(0);
		this.visiblePrompts = this.visiblePromptsStore;
		this.hiddenCount = this.hiddenCountStore;
		this.promptsUnsubscribe = this.manager.prompts.subscribe(
			(prompts: ReadonlyArray<EditorPrompt>): void => {
				this.project(prompts);
			}
		);
	}

	public dispose(): void {
		this.promptsUnsubscribe();
		this.visiblePromptsStore.set([]);
		this.hiddenCountStore.set(0);
	}

	public perform(promptID: EditorPromptID, action: EditorPromptAction): void {
		switch (action.kind) {
			case ConflictPromptActionKind.OVERWRITE:
				this.manager.respondToConflict(promptID, ConflictResolutionStrategy.OVERWRITE);
				return;
			case ConflictPromptActionKind.RELOAD:
				this.manager.respondToConflict(promptID, ConflictResolutionStrategy.RELOAD);
				return;
			case ConflictPromptActionKind.RETRY:
				this.manager.retry(promptID);
				return;
			case InvalidDocumentActionKind.CLOSE:
				this.manager.close(promptID);
				return;
			case InvalidDocumentActionKind.RETRY_CLOSE:
				this.manager.retry(promptID);
				return;
			case GenericPromptActionKind.HIDE:
				this.manager.hide(promptID);
				return;
			case GenericPromptActionKind.DISMISS:
				this.manager.dismiss(promptID);
				return;
		}
	}

	public showAll(): void {
		this.manager.showAll();
	}

	private project(prompts: ReadonlyArray<EditorPrompt>): void {
		const visibleItems: EditorPromptViewItem[] = [];
		let hiddenCount: number = 0;
		for (const prompt of prompts) {
			if (prompt.hidden) {
				hiddenCount = hiddenCount + 1;
				continue;
			}
			if (prompt.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
				visibleItems.push(projectConflictItem(prompt));
				continue;
			}
			if (prompt.kind === EditorPromptKind.INVALID_DOCUMENT) {
				visibleItems.push(projectInvalidItem(prompt));
				continue;
			}
			visibleItems.push(projectNotificationItem(prompt));
		}
		this.visiblePromptsStore.set(visibleItems);
		this.hiddenCountStore.set(hiddenCount);
	}
}

function projectNotificationItem(prompt: NotificationPrompt): NotificationPromptViewItem {
	const promptID: EditorPromptID = prompt.id;
	return {
		kind: EditorPromptViewItemKind.NOTIFICATION,
		id: promptID,
		tone: mapNotificationTone(prompt.tone),
		title: prompt.title,
		content: prompt.content,
		dismiss: {
			promptID: promptID,
			action: { kind: GenericPromptActionKind.DISMISS },
			state: PromptActionState.ENABLED
		}
	};
}

function mapNotificationTone(tone: NotificationPromptToneKind): NotificationPromptViewItemToneKind {
	switch (tone) {
		case NotificationPromptToneKind.INFO:
			return NotificationPromptViewItemToneKind.INFO;
		case NotificationPromptToneKind.WARNING:
			return NotificationPromptViewItemToneKind.WARNING;
		case NotificationPromptToneKind.ERROR:
			return NotificationPromptViewItemToneKind.ERROR;
	}
}

function projectConflictItem(
	prompt: ConflictResolutionPrompt
):
	| PendingConflictResolutionPromptViewItem
	| FailedConflictResolutionPromptViewItem {
	const status = prompt.status;
	const promptID: EditorPromptID = prompt.id;

	if (status.kind === ConflictPromptStatusKind.FAILED) {
		const failedItem: FailedConflictResolutionPromptViewItem = {
			kind: EditorPromptViewItemKind.CONFLICT_RESOLUTION,
			state: ConflictPromptViewItemStateKind.FAILED,
			id: promptID,
			fileName: prompt.fileName,
			errorMessageKey: status.message,
			retry: buildAction(promptID, { kind: ConflictPromptActionKind.RETRY }, PromptActionState.ENABLED),
			dismiss: buildHideAction(promptID, PromptActionState.ENABLED)
		};
		return failedItem;
	}

	if (status.kind === ConflictPromptStatusKind.RESPONDING) {
		const overwriteState: PromptActionState =
			status.strategy === ConflictResolutionStrategy.OVERWRITE
				? PromptActionState.LOADING
				: PromptActionState.DISABLED;
		const reloadState: PromptActionState =
			status.strategy === ConflictResolutionStrategy.RELOAD
				? PromptActionState.LOADING
				: PromptActionState.DISABLED;
		const respondingItem: PendingConflictResolutionPromptViewItem = {
			kind: EditorPromptViewItemKind.CONFLICT_RESOLUTION,
			state: ConflictPromptViewItemStateKind.PENDING,
			id: promptID,
			fileName: prompt.fileName,
			overwrite: buildAction(promptID, { kind: ConflictPromptActionKind.OVERWRITE }, overwriteState),
			reload: buildAction(promptID, { kind: ConflictPromptActionKind.RELOAD }, reloadState),
			dismiss: buildHideAction(promptID, PromptActionState.DISABLED)
		};
		return respondingItem;
	}

	const awaitingItem: PendingConflictResolutionPromptViewItem = {
		kind: EditorPromptViewItemKind.CONFLICT_RESOLUTION,
		state: ConflictPromptViewItemStateKind.PENDING,
		id: promptID,
		fileName: prompt.fileName,
		overwrite: buildAction(promptID, { kind: ConflictPromptActionKind.OVERWRITE }, PromptActionState.ENABLED),
		reload: buildAction(promptID, { kind: ConflictPromptActionKind.RELOAD }, PromptActionState.ENABLED),
		dismiss: buildHideAction(promptID, PromptActionState.ENABLED)
	};
	return awaitingItem;
}

function projectInvalidItem(
	prompt: InvalidDocumentPrompt
):
	| PendingInvalidDocumentPromptViewItem
	| FailedInvalidDocumentPromptViewItem {
	const status = prompt.status;
	const promptID: EditorPromptID = prompt.id;

	if (status.kind === InvalidDocumentPromptStatusKind.FAILED) {
		const failedItem: FailedInvalidDocumentPromptViewItem = {
			kind: EditorPromptViewItemKind.INVALID_DOCUMENT,
			state: InvalidDocumentPromptViewItemStateKind.FAILED,
			id: promptID,
			fileName: prompt.fileName,
			errorMessageKey: status.message,
			retry: buildAction(promptID, { kind: InvalidDocumentActionKind.RETRY_CLOSE }, PromptActionState.ENABLED),
			dismiss: buildHideAction(promptID, PromptActionState.ENABLED)
		};
		return failedItem;
	}

	if (status.kind === InvalidDocumentPromptStatusKind.CLOSING) {
		const closingItem: PendingInvalidDocumentPromptViewItem = {
			kind: EditorPromptViewItemKind.INVALID_DOCUMENT,
			state: InvalidDocumentPromptViewItemStateKind.PENDING,
			id: promptID,
			fileName: prompt.fileName,
			close: buildAction(promptID, { kind: InvalidDocumentActionKind.CLOSE }, PromptActionState.LOADING),
			dismiss: buildHideAction(promptID, PromptActionState.DISABLED)
		};
		return closingItem;
	}

	const awaitingItem: PendingInvalidDocumentPromptViewItem = {
		kind: EditorPromptViewItemKind.INVALID_DOCUMENT,
		state: InvalidDocumentPromptViewItemStateKind.PENDING,
		id: promptID,
		fileName: prompt.fileName,
		close: buildAction(promptID, { kind: InvalidDocumentActionKind.CLOSE }, PromptActionState.ENABLED),
		dismiss: buildHideAction(promptID, PromptActionState.ENABLED)
	};
	return awaitingItem;
}

function buildAction(
	promptID: EditorPromptID,
	action: EditorPromptAction,
	state: PromptActionState
): PromptActionViewItem {
	return {
		promptID: promptID,
		action: action,
		state: state
	};
}

function buildHideAction(
	promptID: EditorPromptID,
	state: PromptActionState
): PromptActionViewItem {
	return {
		promptID: promptID,
		action: { kind: GenericPromptActionKind.HIDE },
		state: state
	};
}
