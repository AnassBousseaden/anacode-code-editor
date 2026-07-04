import type { DraftRevision } from '$lib/core/editor/document/savable-editor-document';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { Brand } from '$lib/core/shared/models-utils';

export type EditorPromptID = Brand<number, 'EditorPromptID'>;

export enum EditorPromptKind {
	CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION',
	INVALID_DOCUMENT = 'INVALID_DOCUMENT',
	NOTIFICATION = 'NOTIFICATION'
}

export enum ConflictResolutionStrategy {
	OVERWRITE = 'OVERWRITE',
	RELOAD = 'RELOAD'
}

export enum ConflictPromptStatusKind {
	AWAITING = 'AWAITING',
	RESPONDING = 'RESPONDING',
	FAILED = 'FAILED'
}

export interface AwaitingConflictPromptStatus {
	readonly kind: ConflictPromptStatusKind.AWAITING;
}

export interface RespondingConflictPromptStatus {
	readonly kind: ConflictPromptStatusKind.RESPONDING;
	readonly strategy: ConflictResolutionStrategy;
}

export interface FailedConflictPromptStatus {
	readonly kind: ConflictPromptStatusKind.FAILED;
	readonly strategy: ConflictResolutionStrategy;
	readonly message: string;
}

export type ConflictPromptStatus =
	| AwaitingConflictPromptStatus
	| RespondingConflictPromptStatus
	| FailedConflictPromptStatus;

export const AWAITING_CONFLICT_PROMPT_STATUS: AwaitingConflictPromptStatus = {
	kind: ConflictPromptStatusKind.AWAITING
};

export interface ConflictResolutionPrompt {
	readonly id: EditorPromptID;
	readonly kind: EditorPromptKind.CONFLICT_RESOLUTION;
	readonly nodeID: NodeID;
	readonly fileName: string;
	readonly revision: DraftRevision;
	readonly status: ConflictPromptStatus;
	readonly hidden: boolean;
}

export enum InvalidDocumentPromptStatusKind {
	AWAITING = 'AWAITING',
	CLOSING = 'CLOSING',
	FAILED = 'FAILED'
}

export interface AwaitingInvalidDocumentPromptStatus {
	readonly kind: InvalidDocumentPromptStatusKind.AWAITING;
}

export interface ClosingInvalidDocumentPromptStatus {
	readonly kind: InvalidDocumentPromptStatusKind.CLOSING;
}

export interface FailedInvalidDocumentPromptStatus {
	readonly kind: InvalidDocumentPromptStatusKind.FAILED;
	readonly message: string;
}

export type InvalidDocumentPromptStatus =
	| AwaitingInvalidDocumentPromptStatus
	| ClosingInvalidDocumentPromptStatus
	| FailedInvalidDocumentPromptStatus;

export const AWAITING_INVALID_DOCUMENT_PROMPT_STATUS: AwaitingInvalidDocumentPromptStatus = {
	kind: InvalidDocumentPromptStatusKind.AWAITING
};

export interface InvalidDocumentPrompt {
	readonly id: EditorPromptID;
	readonly kind: EditorPromptKind.INVALID_DOCUMENT;
	readonly nodeID: NodeID;
	readonly fileName: string;
	readonly revision: DraftRevision;
	readonly status: InvalidDocumentPromptStatus;
	readonly hidden: boolean;
}

export enum NotificationPromptToneKind {
	INFO = 'INFO',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

export interface NotificationPrompt {
	readonly id: EditorPromptID;
	readonly kind: EditorPromptKind.NOTIFICATION;
	readonly tone: NotificationPromptToneKind;
	readonly title: string;
	readonly content: string;
	readonly hidden: boolean;
}

export type EditorPrompt = ConflictResolutionPrompt | InvalidDocumentPrompt | NotificationPrompt;
