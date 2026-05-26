import type { Readable } from 'svelte/store';

import type {
	NodeID,
	NodeOperationFailure
} from '$lib/core/file-system/domain/file-system-models';
import { SaveEntryKind } from '$lib/core/editor/save/registry/draft-registry';
import type {
	IDisposable1,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';

export enum EditorSaveStatus {
	IDLE = 'IDLE',
	SAVING = 'SAVING'
}

export enum EditorSaveFailureKind {
	PERSISTENCE_FAILED = 'PERSISTENCE_FAILED'
}

export type EditorSavePersistenceFailure =
	NodeOperationFailure<EditorSaveFailureKind.PERSISTENCE_FAILED>;

export type EditorSaveFailure = EditorSavePersistenceFailure;

export interface DirtyEntry {
	readonly nodeID: NodeID;
	readonly status: SaveEntryKind;
}

export interface EditorSaveState {
	readonly status: EditorSaveStatus;
	readonly canSaveAll: boolean;
	readonly dirtyCount: number;
	readonly saveableCount: number;
	readonly conflictedCount: number;
	readonly invalidCount: number;
	readonly lastFailure: EditorSaveFailure | null;
}

export enum EditorSaveServiceErrorKind {
	DRAFT_UNRESOLVED = 'DRAFT_UNRESOLVED',
	DRAFT_CONFLICTED = 'DRAFT_CONFLICTED',
	READ_ONLY = 'READ_ONLY',
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	SAVE_ALL_PARTIAL = 'SAVE_ALL_PARTIAL'
}

export type EditorSaveDraftInvalidError =
	NodeOperationFailure<EditorSaveServiceErrorKind.DRAFT_UNRESOLVED>;

export type EditorSaveDraftConflictedError =
	NodeOperationFailure<EditorSaveServiceErrorKind.DRAFT_CONFLICTED>;

export type EditorSaveReadOnlyError = NodeOperationFailure<EditorSaveServiceErrorKind.READ_ONLY>;

export type EditorSaveInternalError = OperationFailure<EditorSaveServiceErrorKind.INTERNAL_ERROR>;

export type EditorSaveTargetFailure =
	| EditorSaveFailure
	| EditorSaveDraftInvalidError
	| EditorSaveDraftConflictedError
	| EditorSaveReadOnlyError;

export type EditorSaveAllError = OperationFailure<EditorSaveServiceErrorKind.SAVE_ALL_PARTIAL> & {
	readonly failures: ReadonlyArray<EditorSaveTargetFailure>;
};

export type EditorSaveError =
	| EditorSaveTargetFailure
	| EditorSaveInternalError
	| EditorSaveAllError;

/**
 * Read-only projection of aggregate editor-save state across all open
 * savable documents.
 *
 * Derived from iterating the document registry and aggregating each doc's
 * draftStatus + pendingSave. Consumers (file-tree projection, tab bar,
 * status bar) subscribe to these aggregates rather than to individual docs.
 */
export interface IObservableEditorSaveState {
	readonly state: Readable<EditorSaveState>;
	readonly dirtyNodeIDs: Readable<ReadonlyArray<NodeID>>;
	readonly dirtyEntries: Readable<ReadonlyArray<DirtyEntry>>;
	readonly saveableNodeIDs: Readable<ReadonlyArray<NodeID>>;
	readonly conflictedNodeIDs: Readable<ReadonlyArray<NodeID>>;
	readonly invalidNodeIDs: Readable<ReadonlyArray<NodeID>>;
}

/**
 * Imperative save commands. Each routes to ISavableEditorDocument methods
 * on the matching document.
 *
 *   - save       — call doc.save() for the given node
 *   - saveAll    — iterate dirty docs, await each doc.save(); aggregate failures
 *   - overwrite  — call doc.forceWrite() for the given node
 */
export interface IEditorSaveCommand {
	save(nodeID: NodeID): Promise<Result<void, EditorSaveError>>;
	saveAll(): Promise<Result<void, EditorSaveError>>;
	overwrite(nodeID: NodeID): Promise<Result<void, EditorSaveError>>;
}

/**
 * Thin coordinator over the document registry.
 *
 * Reads each document's save state to project aggregates; dispatches save
 * commands by calling per-document methods. Owns no per-document save state
 * itself — that lives on ISavableEditorDocument.
 *
 * Collaborators:
 *   - IEditorDocumentRegistry — source of open documents
 */
export interface IEditorSaveService
	extends IObservableEditorSaveState, IEditorSaveCommand, IDisposable1 {}
