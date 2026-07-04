import type { EditorPromptAction } from '$lib/view-models/editor-prompt/editor-prompt-action';
import type { EditorPromptID } from '$lib/core/editor-prompt/editor-prompt';
import type { EditorMessageKey } from '$lib/core/localization/localization-models';

export enum PromptActionState {
	ENABLED = 'ENABLED',
	LOADING = 'LOADING',
	DISABLED = 'DISABLED'
}

export interface PromptActionViewItem {
	readonly promptID: EditorPromptID;
	readonly action: EditorPromptAction;
	readonly state: PromptActionState;
}

export enum EditorPromptViewItemKind {
	CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION',
	INVALID_DOCUMENT = 'INVALID_DOCUMENT',
	NOTIFICATION = 'NOTIFICATION'
}

export enum NotificationPromptViewItemToneKind {
	INFO = 'INFO',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

export interface NotificationPromptViewItem {
	readonly kind: EditorPromptViewItemKind.NOTIFICATION;
	readonly id: EditorPromptID;
	readonly tone: NotificationPromptViewItemToneKind;
	readonly title: string;
	readonly content: string;
	readonly dismiss: PromptActionViewItem;
}

export enum ConflictPromptViewItemStateKind {
	PENDING = 'PENDING',
	FAILED = 'FAILED'
}

export interface PendingConflictResolutionPromptViewItem {
	readonly kind: EditorPromptViewItemKind.CONFLICT_RESOLUTION;
	readonly state: ConflictPromptViewItemStateKind.PENDING;
	readonly id: EditorPromptID;
	readonly fileName: string;
	readonly overwrite: PromptActionViewItem;
	readonly reload: PromptActionViewItem;
	readonly dismiss: PromptActionViewItem;
}

export interface FailedConflictResolutionPromptViewItem {
	readonly kind: EditorPromptViewItemKind.CONFLICT_RESOLUTION;
	readonly state: ConflictPromptViewItemStateKind.FAILED;
	readonly id: EditorPromptID;
	readonly fileName: string;
	readonly errorMessageKey: EditorMessageKey;
	readonly retry: PromptActionViewItem;
	readonly dismiss: PromptActionViewItem;
}

export type ConflictResolutionPromptViewItem =
	| PendingConflictResolutionPromptViewItem
	| FailedConflictResolutionPromptViewItem;

export enum InvalidDocumentPromptViewItemStateKind {
	PENDING = 'PENDING',
	FAILED = 'FAILED'
}

export interface PendingInvalidDocumentPromptViewItem {
	readonly kind: EditorPromptViewItemKind.INVALID_DOCUMENT;
	readonly state: InvalidDocumentPromptViewItemStateKind.PENDING;
	readonly id: EditorPromptID;
	readonly fileName: string;
	readonly close: PromptActionViewItem;
	readonly dismiss: PromptActionViewItem;
}

export interface FailedInvalidDocumentPromptViewItem {
	readonly kind: EditorPromptViewItemKind.INVALID_DOCUMENT;
	readonly state: InvalidDocumentPromptViewItemStateKind.FAILED;
	readonly id: EditorPromptID;
	readonly fileName: string;
	readonly errorMessageKey: EditorMessageKey;
	readonly retry: PromptActionViewItem;
	readonly dismiss: PromptActionViewItem;
}

export type InvalidDocumentPromptViewItem =
	| PendingInvalidDocumentPromptViewItem
	| FailedInvalidDocumentPromptViewItem;

export type EditorPromptViewItem =
	| ConflictResolutionPromptViewItem
	| InvalidDocumentPromptViewItem
	| NotificationPromptViewItem;
