import { InvalidEntryReason } from '$lib/core/editor/save/registry/draft-registry';
import type {
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import { isFileNode } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import type {
	EditorDocumentFactoryError,
	IEditorDocumentFactory
} from '$lib/core/editor/document-factory/editor-document-factory-model';
import type {
	EditorDocumentLoaderError,
	EditorDocumentLoaderTargetUnavailableError,
	IEditorDocumentProvider
} from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider';
import { EditorDocumentLoaderErrorKind } from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider';
import type { IFileURIBuilder } from '$lib/core/workspace/sync/document-record/file-uri-builder';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';

const ErrorMessages = {
	TARGET_UNAVAILABLE: (nodeID: NodeID, reason: InvalidEntryReason): string =>
		`Node ${nodeID} cannot be loaded: ${reason}`,
	DOCUMENT_CREATION_FAILED: (nodeID: NodeID, message: string): string =>
		`Failed to create editor document for node ${nodeID}: ${message}`
} as const;

export class EditorDocumentProvider implements IEditorDocumentProvider {
	private readonly fileSystemService: IFileSystemService;
	private readonly fileURIBuilder: IFileURIBuilder;
	private readonly documentFactory: IEditorDocumentFactory;

	public constructor(
		fileSystemService: IFileSystemService,
		fileURIBuilder: IFileURIBuilder,
		documentFactory: IEditorDocumentFactory
	) {
		this.fileSystemService = fileSystemService;
		this.fileURIBuilder = fileURIBuilder;
		this.documentFactory = documentFactory;
	}

	public resolveOptionsFromFS(
		nodeID: NodeID
	): Result<SavableEditorDocumentOptions, EditorDocumentLoaderTargetUnavailableError> {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);

		if (node === null) {
			return failure(createTargetUnavailableError(nodeID, InvalidEntryReason.TARGET_DELETED));
		}

		if (!isFileNode(node)) {
			return failure(createTargetUnavailableError(nodeID, InvalidEntryReason.TARGET_NOT_FILE));
		}

		const options: SavableEditorDocumentOptions = {
			fileURI: this.fileURIBuilder.build(node.path),
			content: node.content,
			isReadOnly: !node.permissions.write,
			baseHash: node.contentHash
		};
		return success(options);
	}

	public async load(
		nodeID: NodeID,
		options: SavableEditorDocumentOptions
	): Promise<Result<ISavableEditorDocument, EditorDocumentLoaderError>> {
		const creationResult: Result<ISavableEditorDocument, EditorDocumentFactoryError> =
			await this.documentFactory.create(nodeID, options);

		if (!creationResult.ok) {
			return failure({
				kind: EditorDocumentLoaderErrorKind.DOCUMENT_CREATION_FAILED,
				message: ErrorMessages.DOCUMENT_CREATION_FAILED(nodeID, creationResult.error.message),
				nodeID: nodeID
			});
		}

		return success(creationResult.value);
	}
}

function createTargetUnavailableError(
	nodeID: NodeID,
	reason: InvalidEntryReason
): EditorDocumentLoaderTargetUnavailableError {
	return {
		kind: EditorDocumentLoaderErrorKind.TARGET_UNAVAILABLE,
		message: ErrorMessages.TARGET_UNAVAILABLE(nodeID, reason),
		nodeID: nodeID,
		reason: reason
	};
}
