import type { Readable } from 'svelte/store';

import type { DraftRevision } from '$lib/core/editor/document/savable-editor-document';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	IDisposable1,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';
import type { InvalidItem } from '$lib/core/editor/invalid-document/invalid-document-models';

export interface IObservableInvalidDocumentService {
	readonly items: Readable<ReadonlyArray<InvalidItem>>;
}

export enum CloseInvalidDocumentErrorKind {
	NOT_FOUND = 'NOT_FOUND',
	STALE_REVISION = 'STALE_REVISION',
	NOT_INVALID = 'NOT_INVALID',
	EVICT_FAILED = 'EVICT_FAILED',
	DISPOSED = 'DISPOSED'
}

export type CloseInvalidDocumentError = OperationFailure<CloseInvalidDocumentErrorKind>;

export const CloseInvalidDocumentErrorMessages: Readonly<
	Record<CloseInvalidDocumentErrorKind, string>
> = {
	[CloseInvalidDocumentErrorKind.NOT_FOUND]: 'Document is no longer open.',
	[CloseInvalidDocumentErrorKind.STALE_REVISION]: 'Document state changed — re-evaluate.',
	[CloseInvalidDocumentErrorKind.NOT_INVALID]: 'Document is no longer invalid.',
	[CloseInvalidDocumentErrorKind.EVICT_FAILED]: 'Could not close the document.',
	[CloseInvalidDocumentErrorKind.DISPOSED]: 'Service was disposed.'
};

export interface IInvalidDocumentService
	extends IObservableInvalidDocumentService,
		IDisposable1 {
	getItem(nodeID: NodeID): InvalidItem | null;

	close(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, CloseInvalidDocumentError>>;
}
