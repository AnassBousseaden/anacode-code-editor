import {
	type EditorDocumentFactoryError,
	EditorDocumentFactoryErrorKind,
	type IEditorDocumentFactory
} from '$lib/core/editor/document-factory/editor-document-factory-model';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import { SavableEditorDocument } from '$lib/core/editor/document/savable-editor-document-impl';
import type {
	ContentHash,
	FileSystemNode,
	FileSystemWriteOrigin,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import { isFileNode } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import type { IMonacoRuntime } from '$lib/core/editor/monaco/monaco-runtime';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';

const ErrorMessages = {
	CREATION_FAILED: (nodeID: NodeID, message: string): string =>
		`Failed to create editor document for node ${nodeID}: ${message}`,
	NODE_MISSING: (nodeID: NodeID): string =>
		`File system node ${nodeID} is missing or is not a file at construction time.`
} as const;

export class EditorDocumentFactory implements IEditorDocumentFactory {
	private readonly monacoRuntime: IMonacoRuntime;
	private readonly contentHashService: IContentHashService;
	private readonly fileSystemService: IFileSystemService;
	private readonly workspaceOrigin: FileSystemWriteOrigin;

	public constructor(
		monacoRuntime: IMonacoRuntime,
		contentHashService: IContentHashService,
		fileSystemService: IFileSystemService,
		workspaceOrigin: FileSystemWriteOrigin
	) {
		this.monacoRuntime = monacoRuntime;
		this.contentHashService = contentHashService;
		this.fileSystemService = fileSystemService;
		this.workspaceOrigin = workspaceOrigin;
	}

	public async create(
		nodeID: NodeID,
		options: SavableEditorDocumentOptions
	): Promise<Result<ISavableEditorDocument, EditorDocumentFactoryError>> {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null || !isFileNode(node)) {
			return failure({
				kind: EditorDocumentFactoryErrorKind.INTERNAL_ERROR,
				message: ErrorMessages.NODE_MISSING(nodeID),
				nodeID: nodeID
			});
		}
		const actualHash: ContentHash = node.contentHash;

		const hashResult: Result<ContentHash, OperationError> =
			await this.contentHashService.computeHash(options.content);
		if (!hashResult.ok) {
			return failure({
				kind: EditorDocumentFactoryErrorKind.INTERNAL_ERROR,
				message: ErrorMessages.CREATION_FAILED(nodeID, hashResult.error.message),
				nodeID: nodeID
			});
		}

		try {
			const savableDocument: ISavableEditorDocument = new SavableEditorDocument(
				this.monacoRuntime,
				nodeID,
				options,
				hashResult.value,
				actualHash,
				this.contentHashService,
				this.fileSystemService,
				this.workspaceOrigin
			);
			return success(savableDocument);
		} catch (error: unknown) {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
			return failure({
				kind: EditorDocumentFactoryErrorKind.INTERNAL_ERROR,
				message: ErrorMessages.CREATION_FAILED(nodeID, errorMessage),
				nodeID: nodeID
			});
		}
	}
}
