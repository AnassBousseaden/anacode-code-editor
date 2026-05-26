import type { Readable } from 'svelte/store';

import type { ContentHash, NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	EditorDocumentOptions,
	IEditorDocument
} from '$lib/core/editor/document/editor-document';
import type { IDisposable1, OperationFailure, Result } from '$lib/core/shared/models-utils';

export interface SavableEditorDocumentOptions extends EditorDocumentOptions {
	readonly baseHash: ContentHash;
}

/**
 * Editor document that owns its content (via Monaco model), its save state,
 * and the operations that produce that state.
 *
 * Concurrency: command methods (save, forceWrite, revert) run serially per
 * document. A call that arrives while another is in flight queues behind it
 * (FIFO). Concurrent saves do not coalesce. `pendingSave` observes whether a
 * write is currently in flight.
 */

// =====================================================================
// Draft status
//
// Content lives in the Monaco model — not duplicated on status variants.
// Consumers that need the buffer read it via the model directly; consumers
// that only need to know "is this saveable?" read draftStatus.kind.
// =====================================================================

export enum DraftStatusKind {
	CLEAN = 'CLEAN',
	SAVEABLE = 'SAVEABLE',
	CONFLICTED = 'CONFLICTED',
	INVALID = 'INVALID'
}

/**
 * INVALID has a single semantic today: the target file no longer exists on
 * disk. The state can transition back to CLEAN if the target reappears
 * (e.g., user restores the file). Other "cannot save" conditions are
 * represented separately:
 *   - read-only target  → `readOnly: Readable<boolean>`; surface as save error
 *   - hash failure      → internal error, not a domain state
 *   - target-not-file   → construction-time error, never mid-life
 */
export interface DraftRevision {
	readonly value: number;
}

export interface CleanDraftStatus {
	readonly kind: DraftStatusKind.CLEAN;
}

export interface SaveableDraftStatus {
	readonly kind: DraftStatusKind.SAVEABLE;
	readonly contentHash: ContentHash;
	readonly revision: DraftRevision;
}

export interface ConflictedDraftStatus {
	readonly kind: DraftStatusKind.CONFLICTED;
	readonly contentHash: ContentHash;
	readonly actualHash: ContentHash;
	readonly revision: DraftRevision;
}

export interface InvalidDraftStatus {
	readonly kind: DraftStatusKind.INVALID;
	readonly revision: DraftRevision;
}

export type DraftStatus =
	| CleanDraftStatus
	| SaveableDraftStatus
	| ConflictedDraftStatus
	| InvalidDraftStatus;

export enum DocumentSaveErrorKind {
	CONFLICTED = 'CONFLICTED',
	INVALID = 'INVALID',
	READ_ONLY = 'READ_ONLY',
	PORT_WRITE_FAILED = 'PORT_WRITE_FAILED',
	DISPOSED = 'DISPOSED'
}

export type DocumentSaveError = OperationFailure<DocumentSaveErrorKind>;

export enum DocumentForceWriteErrorKind {
	NOT_CONFLICTED = 'NOT_CONFLICTED',
	INVALID = 'INVALID',
	READ_ONLY = 'READ_ONLY',
	CONFLICTED = 'CONFLICTED',
	PORT_WRITE_FAILED = 'PORT_WRITE_FAILED',
	DISPOSED = 'DISPOSED'
}

export type DocumentForceWriteError = OperationFailure<DocumentForceWriteErrorKind>;

export enum DocumentRevertErrorKind {
	INVALID = 'INVALID',
	PORT_READ_FAILED = 'PORT_READ_FAILED',
	DISPOSED = 'DISPOSED'
}

export type DocumentRevertError = OperationFailure<DocumentRevertErrorKind>;


export interface IObservableSavableEditorDocument extends IEditorDocument {
	readonly nodeID: NodeID;
	readonly baseHash: Readable<ContentHash>;
	readonly draftStatus: Readable<DraftStatus>;
	readonly readOnly: Readable<boolean>;

	getDocumentOptions(): SavableEditorDocumentOptions;

	/**
	 * True while a save / forceWrite is in flight. Independent of
	 * draftStatus — a document can be SAVEABLE *and* pendingSave at the
	 * same time (user typed during a write).
	 */
	readonly pendingSave: Readable<boolean>;
}

// =====================================================================
// Write commands
//
// The only public mutators. State-transition primitives (advanceBase,
// promoteToConflicted, etc.) are not exposed — the document drives those
// internally from these commands and from its own subscriptions to FS
// truth (wired by the constructor, not part of this interface).
// =====================================================================

export interface ISavableEditorDocumentWriter {
	/**
	 * Persist the current SAVEABLE draft via the save port.
	 *
	 * Status preconditions:
	 *   CLEAN       → returns NO_SAVEABLE_DRAFT (caller asked for nothing).
	 *   SAVEABLE    → attempts write. On CAS-fail, self-promotes to
	 *                 CONFLICTED and returns CONFLICTED.
	 *   CONFLICTED  → returns CONFLICTED. Caller must forceWrite() or
	 *                 revert() first.
	 *   INVALID     → returns INVALID.
	 *
	 * Read-only target: returns READ_ONLY without attempting the port.
	 *
	 * Concurrency: if another save / forceWrite is in flight, queues
	 * behind it. Does not coalesce; the second call gets its own attempt
	 * once the first resolves.
	 */
	save(): Promise<Result<void, DocumentSaveError>>;

	/**
	 * Force-resolve a CONFLICTED state by rebasing onto the latest FS
	 * snapshot and writing the local content against it — atomically.
	 *
	 * This is the single replacement for the previous overwrite() +
	 * rebaseOntoExternalBase() split. Splitting them surfaced a TOCTOU
	 * window where a third external write could land between rebase and
	 * the user's next save; combining them eliminates the window.
	 *
	 * Status preconditions:
	 *   CONFLICTED → reads fresh FS content for the new base, writes local
	 *                content against it, advances base on success.
	 *   anything else → returns NOT_CONFLICTED.
	 *
	 * Read-only target: returns READ_ONLY.
	 */
	forceWrite(): Promise<Result<void, DocumentForceWriteError>>;

	/**
	 * Discard the current draft and reload the buffer from FS. Replaces
	 * the Monaco model content; transitions to CLEAN; advances baseHash.
	 *
	 * Status preconditions: none. revert() is valid from any status —
	 * even CLEAN it does a useful no-op-ish refresh (rereads disk).
	 * The only failure paths are PORT_READ_FAILED (FS unreachable) and
	 * INVALID (target was deleted; nothing to read).
	 */
	revert(): Promise<Result<void, DocumentRevertError>>;
}

export interface ISavableEditorDocument
	extends IObservableSavableEditorDocument, ISavableEditorDocumentWriter, IDisposable1 {}
