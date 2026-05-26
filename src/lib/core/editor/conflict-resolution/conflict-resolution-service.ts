import type { Readable } from 'svelte/store';

import type { DraftRevision } from '$lib/core/editor/document/savable-editor-document';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	IDisposable1,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';
import type { ConflictItem } from '$lib/core/editor/conflict-resolution/conflict-resolution-models';

export interface IObservableConflictResolutionService {
	readonly items: Readable<ReadonlyArray<ConflictItem>>;
}

export enum OverwriteConflictErrorKind {
	NOT_FOUND = 'NOT_FOUND',
	STALE_REVISION = 'STALE_REVISION',
	NOT_CONFLICTED = 'NOT_CONFLICTED',
	INVALID = 'INVALID',
	READ_ONLY = 'READ_ONLY',
	PORT_WRITE_FAILED = 'PORT_WRITE_FAILED',
	DISPOSED = 'DISPOSED'
}

export type OverwriteConflictError = OperationFailure<OverwriteConflictErrorKind>;

export enum ReloadConflictErrorKind {
	NOT_FOUND = 'NOT_FOUND',
	STALE_REVISION = 'STALE_REVISION',
	NOT_CONFLICTED = 'NOT_CONFLICTED',
	PORT_READ_FAILED = 'PORT_READ_FAILED',
	INVALID = 'INVALID',
	DISPOSED = 'DISPOSED'
}

export type ReloadConflictError = OperationFailure<ReloadConflictErrorKind>;

export const OverwriteConflictErrorMessages: Readonly<
	Record<OverwriteConflictErrorKind, string>
> = {
	[OverwriteConflictErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[OverwriteConflictErrorKind.STALE_REVISION]: 'File changed again on disk — re-evaluate.',
	[OverwriteConflictErrorKind.NOT_CONFLICTED]: 'File is not in a conflicted state.',
	[OverwriteConflictErrorKind.INVALID]: 'File no longer exists on disk.',
	[OverwriteConflictErrorKind.READ_ONLY]: 'Target is read-only.',
	[OverwriteConflictErrorKind.PORT_WRITE_FAILED]: 'Could not write to disk.',
	[OverwriteConflictErrorKind.DISPOSED]: 'Document was closed.'
};

export const ReloadConflictErrorMessages: Readonly<Record<ReloadConflictErrorKind, string>> = {
	[ReloadConflictErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[ReloadConflictErrorKind.STALE_REVISION]: 'File changed again on disk — re-evaluate.',
	[ReloadConflictErrorKind.NOT_CONFLICTED]: 'File is not in a conflicted state.',
	[ReloadConflictErrorKind.PORT_READ_FAILED]: 'Could not read from disk.',
	[ReloadConflictErrorKind.INVALID]: 'File no longer exists on disk.',
	[ReloadConflictErrorKind.DISPOSED]: 'Document was closed.'
};

export interface IConflictResolutionService
	extends IObservableConflictResolutionService,
		IDisposable1 {
	getItem(nodeID: NodeID): ConflictItem | null;

	overwrite(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, OverwriteConflictError>>;

	reload(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, ReloadConflictError>>;
}
