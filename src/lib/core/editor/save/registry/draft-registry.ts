import type {
	ContentHash,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';

export enum SaveEntryKind {
	SAVEABLE = 'SAVEABLE',
	CONFLICTED = 'CONFLICTED',
	INVALID = 'INVALID'
}

export enum InvalidEntryReason {
	TARGET_DELETED = 'TARGET_DELETED',
	TARGET_NOT_FILE = 'TARGET_NOT_FILE',
	TARGET_READ_ONLY = 'TARGET_READ_ONLY',
	HASH_COMPUTATION_FAILED = 'HASH_COMPUTATION_FAILED'
}

export interface DraftRevision {
	readonly value: number;
}

export interface SaveableEntry {
	readonly kind: SaveEntryKind.SAVEABLE;
	readonly nodeID: NodeID;
	readonly content: string;
	readonly baseHash: ContentHash;
	readonly revision: DraftRevision;
}

export interface ConflictedEntry {
	readonly kind: SaveEntryKind.CONFLICTED;
	readonly nodeID: NodeID;
	readonly content: string;
	readonly baseHash: ContentHash;
	readonly actualHash: ContentHash;
	readonly revision: DraftRevision;
}

export interface InvalidEntry {
	readonly kind: SaveEntryKind.INVALID;
	readonly nodeID: NodeID;
	readonly content: string;
	readonly baseHash: ContentHash | null;
	readonly revision: DraftRevision;
	readonly reason: InvalidEntryReason;
}

export type SaveEntry = SaveableEntry | ConflictedEntry | InvalidEntry;

export interface DirtyEntry {
	readonly nodeID: NodeID;
	readonly status: SaveEntryKind;
}
