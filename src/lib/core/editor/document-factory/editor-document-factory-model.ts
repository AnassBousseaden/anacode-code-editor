import type {
	NodeID,
	NodeOperationFailure
} from '$lib/core/file-system/domain/file-system-models';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import type { Result } from '$lib/core/shared/models-utils';

export enum EditorDocumentFactoryErrorKind {
	INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export type EditorDocumentFactoryError =
	NodeOperationFailure<EditorDocumentFactoryErrorKind.INTERNAL_ERROR>;

export interface IEditorDocumentFactory {
	create(
		nodeID: NodeID,
		options: SavableEditorDocumentOptions
	): Promise<Result<ISavableEditorDocument, EditorDocumentFactoryError>>;
}
