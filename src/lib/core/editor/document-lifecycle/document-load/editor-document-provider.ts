import type { InvalidEntryReason } from '$lib/core/editor/save/registry/draft-registry';
import type {
	NodeID,
	NodeOperationFailure
} from '$lib/core/file-system/domain/file-system-models';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import type { Result } from '$lib/core/shared/models-utils';

export enum EditorDocumentLoaderErrorKind {
	DOCUMENT_CREATION_FAILED = 'DOCUMENT_CREATION_FAILED',
	TARGET_UNAVAILABLE = 'TARGET_UNAVAILABLE'
}

export type EditorDocumentLoaderDocumentCreationFailedError =
	NodeOperationFailure<EditorDocumentLoaderErrorKind.DOCUMENT_CREATION_FAILED>;

export interface EditorDocumentLoaderTargetUnavailableError
	extends NodeOperationFailure<EditorDocumentLoaderErrorKind.TARGET_UNAVAILABLE> {
	readonly reason: InvalidEntryReason;
}

export type EditorDocumentLoaderError =
	| EditorDocumentLoaderDocumentCreationFailedError
	| EditorDocumentLoaderTargetUnavailableError;

export interface IEditorDocumentProvider {
	resolveOptionsFromFS(
		nodeID: NodeID
	): Result<SavableEditorDocumentOptions, EditorDocumentLoaderTargetUnavailableError>;

	load(
		nodeID: NodeID,
		options: SavableEditorDocumentOptions
	): Promise<Result<ISavableEditorDocument, EditorDocumentLoaderError>>;
}
