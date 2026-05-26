import { get, type Readable, type Unsubscriber, type Writable, writable } from 'svelte/store';
import { editor, type IDisposable, Uri } from 'monaco-editor';

import { generateRandomID } from '$lib/core/shared/models-utils';
import type {
	AtomicEventPayload,
	ContentHash,
	FileSystemEvent,
	FileSystemNode,
	FileSystemWriteOrigin,
	NodeID,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import {
	FileSystemEventType,
	isFileNode
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import type {
	EditorConfigurableDocumentOptions,
	EditorDocumentID
} from '$lib/core/editor/document/editor-document';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import type {
	DocumentForceWriteError,
	DocumentRevertError,
	DocumentSaveError,
	DraftRevision,
	DraftStatus,
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import {
	DocumentForceWriteErrorKind,
	DocumentRevertErrorKind,
	DocumentSaveErrorKind,
	DraftStatusKind
} from '$lib/core/editor/document/savable-editor-document';

const CLEAN_STATUS: DraftStatus = { kind: DraftStatusKind.CLEAN };

const ErrorMessages = {
	CONFLICTED: (nodeID: NodeID): string => `Cannot save node ${nodeID}: draft is conflicted.`,
	INVALID: (nodeID: NodeID): string => `Cannot save node ${nodeID}: target deleted.`,
	READ_ONLY: (nodeID: NodeID): string => `Cannot save node ${nodeID}: target is read-only.`,
	NOT_CONFLICTED: (nodeID: NodeID): string =>
		`Cannot forceWrite node ${nodeID}: status is not CONFLICTED.`,
	PORT_WRITE_FAILED: (nodeID: NodeID, message: string): string =>
		`Failed to persist node ${nodeID}: ${message}`,
	PORT_READ_FAILED: (nodeID: NodeID): string =>
		`Failed to read fresh content for node ${nodeID}: node not found.`,
	DISPOSED: (nodeID: NodeID): string =>
		`Operation aborted for node ${nodeID}: document was disposed.`
} as const;

export class SavableEditorDocument implements ISavableEditorDocument {
	public readonly id: EditorDocumentID;
	public readonly nodeID: NodeID;
	public readonly baseHash: Readable<ContentHash>;
	public readonly draftStatus: Readable<DraftStatus>;
	public readonly readOnly: Readable<boolean>;
	public readonly pendingSave: Readable<boolean>;

	private readonly _model: editor.ITextModel;
	private readonly _fileURI: string;
	private readonly modelChangeDisposable: IDisposable;

	private readonly _baseHash: Writable<ContentHash>;
	private readonly _draftStatus: Writable<DraftStatus>;
	private readonly _readOnly: Writable<boolean>;
	private readonly _pendingSave: Writable<boolean>;

	private readonly contentHashService: IContentHashService;
	private readonly fileSystemService: IFileSystemService;
	private readonly workspaceOrigin: FileSystemWriteOrigin;

	private readonly fsTransactionUnsubscribe: Unsubscriber;

	private operationChain: Promise<void>;
	private revisionCounter: number;
	private hashActivationToken: number;
	private suppressNextModelChange: boolean;
	private disposed: boolean;
	private pendingSaveCount: number;

	public constructor(
		nodeID: NodeID,
		editorDocumentOptions: SavableEditorDocumentOptions,
		initialContentHash: ContentHash,
		initialActualHash: ContentHash,
		contentHashService: IContentHashService,
		fileSystemService: IFileSystemService,
		workspaceOrigin: FileSystemWriteOrigin,
		configurableDocumentOptions: EditorConfigurableDocumentOptions = {}
	) {
		this.id = generateRandomID() as EditorDocumentID;
		this.nodeID = nodeID;
		this._fileURI = editorDocumentOptions.fileURI;
		this.contentHashService = contentHashService;
		this.fileSystemService = fileSystemService;
		this.workspaceOrigin = workspaceOrigin;

		this.operationChain = Promise.resolve();
		this.revisionCounter = 0;
		this.hashActivationToken = 0;
		this.suppressNextModelChange = false;
		this.disposed = false;
		this.pendingSaveCount = 0;

		const fileUri: Uri = Uri.parse(editorDocumentOptions.fileURI);
		const existingModel: editor.ITextModel | null = editor.getModel(fileUri);
		if (existingModel !== null) {
			throw new Error('SavableEditorDocument already exists for this file URI');
		}

		this._model = editor.createModel(editorDocumentOptions.content, undefined, fileUri);
		this.applyConfigurableOptions(configurableDocumentOptions);

		const initialDraftStatus: DraftStatus = deriveInitialDraftStatus(
			initialContentHash,
			initialActualHash,
			editorDocumentOptions.baseHash,
			(): DraftRevision => this.nextRevision()
		);

		this._baseHash = writable<ContentHash>(editorDocumentOptions.baseHash);
		this._draftStatus = writable<DraftStatus>(initialDraftStatus);
		this._readOnly = writable<boolean>(editorDocumentOptions.isReadOnly);
		this._pendingSave = writable<boolean>(false);

		this.baseHash = this._baseHash;
		this.draftStatus = this._draftStatus;
		this.readOnly = this._readOnly;
		this.pendingSave = this._pendingSave;

		this.modelChangeDisposable = this.bindModelChangeListener();

		this.fsTransactionUnsubscribe = this.fileSystemService.onTransaction(
			(event: FileSystemEvent): void => {
				this.handleFileSystemTransaction(event);
			}
		);
	}

	public get model(): editor.ITextModel {
		return this._model;
	}

	public getDocumentOptions(): SavableEditorDocumentOptions {
		return {
			fileURI: this._fileURI,
			content: this._model.getValue(),
			isReadOnly: get(this._readOnly),
			baseHash: get(this._baseHash)
		};
	}

	public updateOptions(options: EditorConfigurableDocumentOptions): void {
		this.applyConfigurableOptions(options);
	}

	// ============================================================
	// Writer commands
	// ============================================================

	public save(): Promise<Result<void, DocumentSaveError>> {
		this.incrementPendingSave();
		return this.enqueue<Result<void, DocumentSaveError>>(
			async (): Promise<Result<void, DocumentSaveError>> => {
				try {
					return await this.performSave();
				} finally {
					this.decrementPendingSave();
				}
			}
		);
	}

	public forceWrite(): Promise<Result<void, DocumentForceWriteError>> {
		this.incrementPendingSave();
		return this.enqueue<Result<void, DocumentForceWriteError>>(
			async (): Promise<Result<void, DocumentForceWriteError>> => {
				try {
					return await this.performForceWrite();
				} finally {
					this.decrementPendingSave();
				}
			}
		);
	}

	public revert(): Promise<Result<void, DocumentRevertError>> {
		return this.enqueue<Result<void, DocumentRevertError>>(
			(): Promise<Result<void, DocumentRevertError>> => this.performRevert()
		);
	}


	public dispose(): void {
		this.disposed = true;
		this.hashActivationToken = this.hashActivationToken + 1;
		this.modelChangeDisposable.dispose();
		this.fsTransactionUnsubscribe();
		this._model.dispose();
	}

	// ============================================================
	// Command implementations (serialized via operationChain)
	// ============================================================

	private async performSave(): Promise<Result<void, DocumentSaveError>> {
		if (this.disposed) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.DISPOSED));
		}

		const currentStatus: DraftStatus = get(this._draftStatus);

		if (currentStatus.kind === DraftStatusKind.CLEAN) {
			return success<void>(undefined);
		}

		if (currentStatus.kind === DraftStatusKind.CONFLICTED) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.CONFLICTED));
		}

		if (currentStatus.kind === DraftStatusKind.INVALID) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.INVALID));
		}

		if (get(this._readOnly)) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.READ_ONLY));
		}

		const contentToWrite: string = this._model.getValue();
		const baseHashAtSave: ContentHash = get(this._baseHash);

		const writeResult: Result<void, OperationError> = await this.fileSystemService.updateContentIf(
			this.nodeID,
			contentToWrite,
			this.workspaceOrigin,
			baseHashAtSave
		);

		if (this.disposed) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.DISPOSED));
		}

		if (!writeResult.ok) {
			return this.diagnoseAndHandleSaveFailure(writeResult.error, contentToWrite);
		}

		const hashResult: Result<ContentHash, OperationError> =
			await this.contentHashService.computeHash(contentToWrite);
		if (this.disposed) {
			return failure(this.buildSaveError(DocumentSaveErrorKind.DISPOSED));
		}
		if (!hashResult.ok) {
			return failure(
				this.buildSaveError(DocumentSaveErrorKind.PORT_WRITE_FAILED, hashResult.error.message)
			);
		}

		this.advanceBase(hashResult.value);
		return success<void>(undefined);
	}

	private async performForceWrite(): Promise<Result<void, DocumentForceWriteError>> {
		if (this.disposed) {
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.DISPOSED));
		}

		const currentStatus: DraftStatus = get(this._draftStatus);

		if (currentStatus.kind !== DraftStatusKind.CONFLICTED) {
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.NOT_CONFLICTED));
		}

		if (get(this._readOnly)) {
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.READ_ONLY));
		}

		const contentToWrite: string = this._model.getValue();
		const targetHash: ContentHash = currentStatus.actualHash;

		const writeResult: Result<void, OperationError> = await this.fileSystemService.updateContentIf(
			this.nodeID,
			contentToWrite,
			this.workspaceOrigin,
			targetHash
		);

		if (this.disposed) {
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.DISPOSED));
		}

		if (!writeResult.ok) {
			return this.diagnoseAndHandleForceWriteFailure(writeResult.error);
		}

		const hashResult: Result<ContentHash, OperationError> =
			await this.contentHashService.computeHash(contentToWrite);
		if (this.disposed) {
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.DISPOSED));
		}
		if (!hashResult.ok) {
			return failure(
				this.buildForceWriteError(
					DocumentForceWriteErrorKind.PORT_WRITE_FAILED,
					hashResult.error.message
				)
			);
		}

		this.advanceBase(hashResult.value);
		return success<void>(undefined);
	}

	private async performRevert(): Promise<Result<void, DocumentRevertError>> {
		if (this.disposed) {
			return failure(this.buildRevertError(DocumentRevertErrorKind.DISPOSED));
		}

		const node: FileSystemNode | null = this.fileSystemService.getNode(this.nodeID);
		if (node === null) {
			this.markInvalid();
			return failure(this.buildRevertError(DocumentRevertErrorKind.INVALID));
		}
		if (!isFileNode(node)) {
			return failure(this.buildRevertError(DocumentRevertErrorKind.PORT_READ_FAILED));
		}

		this.applyFreshContentToModel(node.content);
		this._baseHash.set(node.contentHash);
		this._draftStatus.set(CLEAN_STATUS);
		return success<void>(undefined);
	}

	// ============================================================
	// FS event handling — content / deletion / path change
	// ============================================================

	private handleFileSystemTransaction(event: FileSystemEvent): void {
		for (const change of event.changes) {
			if (change.nodeID !== this.nodeID) {
				continue;
			}
			this.handleAtomicChange(change);
		}
	}

	private handleAtomicChange(change: AtomicEventPayload): void {
		if (change.type === FileSystemEventType.NODE_CONTENT_UPDATED) {
			if (change.origin === this.workspaceOrigin) {
				return;
			}
			this.handleExternalContentChange(change.after.content, change.after.contentHash);
			return;
		}

		if (change.type === FileSystemEventType.NODE_DELETED) {
			this.markInvalid();
			return;
		}

	}

	private handleModelContentChanged(): void {
		const newContent: string = this._model.getValue();

		if (this.suppressNextModelChange) {
			this.suppressNextModelChange = false;
			return;
		}

		void this.scheduleHashAndTransition(newContent);
	}

	private async scheduleHashAndTransition(newContent: string): Promise<void> {
		const token: number = this.hashActivationToken + 1;
		this.hashActivationToken = token;

		const hashResult: Result<ContentHash, OperationError> =
			await this.contentHashService.computeHash(newContent);

		if (token !== this.hashActivationToken || this.disposed) {
			return;
		}
		if (!hashResult.ok) {
			return;
		}

		const newHash: ContentHash = hashResult.value;
		const currentBase: ContentHash = get(this._baseHash);
		const currentStatus: DraftStatus = get(this._draftStatus);

		if (currentStatus.kind === DraftStatusKind.INVALID) {
			return;
		}

		if (currentStatus.kind === DraftStatusKind.CONFLICTED) {
			this._draftStatus.set({
				kind: DraftStatusKind.CONFLICTED,
				contentHash: newHash,
				actualHash: currentStatus.actualHash,
				revision: this.nextRevision()
			});
			return;
		}

		if (newHash === currentBase) {
			this._draftStatus.set(CLEAN_STATUS);
			return;
		}

		this._draftStatus.set({
			kind: DraftStatusKind.SAVEABLE,
			contentHash: newHash,
			revision: this.nextRevision()
		});
	}

	private handleExternalContentChange(externalContent: string, externalHash: ContentHash): void {
		const currentMonacoContent: string = this._model.getValue();
		if (currentMonacoContent === externalContent) {
			return;
		}

		const currentStatus: DraftStatus = get(this._draftStatus);

		if (currentStatus.kind === DraftStatusKind.INVALID) {
			return;
		}

		if (currentStatus.kind === DraftStatusKind.CLEAN) {
			void this.enqueue<void>(
				(): Promise<void> => this.applyExternalAcceptance(externalContent, externalHash)
			);
			return;
		}

		this._draftStatus.set({
			kind: DraftStatusKind.CONFLICTED,
			contentHash: currentStatus.contentHash,
			actualHash: externalHash,
			revision: this.nextRevision()
		});
	}

	private async applyExternalAcceptance(
		externalContent: string,
		externalHash: ContentHash
	): Promise<void> {
		if (this.disposed) {
			return;
		}
		const currentStatus: DraftStatus = get(this._draftStatus);
		if (currentStatus.kind !== DraftStatusKind.CLEAN) {
			return;
		}
		this.applyFreshContentToModel(externalContent);
		this._baseHash.set(externalHash);
		this._draftStatus.set(CLEAN_STATUS);
	}

	// ============================================================
	// Internal state transitions
	// ============================================================

	private advanceBase(newBaseHash: ContentHash): void {
		this.hashActivationToken = this.hashActivationToken + 1;
		this._baseHash.set(newBaseHash);
		this._draftStatus.set(CLEAN_STATUS);
	}

	private markInvalid(): void {
		const currentStatus: DraftStatus = get(this._draftStatus);
		if (currentStatus.kind === DraftStatusKind.INVALID) {
			return;
		}
		this._draftStatus.set({
			kind: DraftStatusKind.INVALID,
			revision: this.nextRevision()
		});
	}

	private async diagnoseAndHandleSaveFailure(
		writeError: OperationError,
		contentAttempted: string
	): Promise<Result<void, DocumentSaveError>> {
		const node: FileSystemNode | null = this.fileSystemService.getNode(this.nodeID);

		if (node === null) {
			this.markInvalid();
			return failure(this.buildSaveError(DocumentSaveErrorKind.INVALID));
		}

		if (!isFileNode(node)) {
			return failure(
				this.buildSaveError(DocumentSaveErrorKind.PORT_WRITE_FAILED, writeError.message)
			);
		}

		const baseHashAtSave: ContentHash = get(this._baseHash);
		if (node.contentHash !== baseHashAtSave) {
			const localHashResult: Result<ContentHash, OperationError> =
				await this.contentHashService.computeHash(contentAttempted);
			const localHash: ContentHash = localHashResult.ok ? localHashResult.value : baseHashAtSave;
			this._draftStatus.set({
				kind: DraftStatusKind.CONFLICTED,
				contentHash: localHash,
				actualHash: node.contentHash,
				revision: this.nextRevision()
			});
			return failure(this.buildSaveError(DocumentSaveErrorKind.CONFLICTED));
		}

		return failure(
			this.buildSaveError(DocumentSaveErrorKind.PORT_WRITE_FAILED, writeError.message)
		);
	}

	private async diagnoseAndHandleForceWriteFailure(
		writeError: OperationError
	): Promise<Result<void, DocumentForceWriteError>> {
		const node: FileSystemNode | null = this.fileSystemService.getNode(this.nodeID);

		if (node === null) {
			this.markInvalid();
			return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.INVALID));
		}

		if (!isFileNode(node)) {
			return failure(
				this.buildForceWriteError(DocumentForceWriteErrorKind.PORT_WRITE_FAILED, writeError.message)
			);
		}

		const currentStatus: DraftStatus = get(this._draftStatus);
		const localHash: ContentHash =
			currentStatus.kind === DraftStatusKind.CONFLICTED
				? currentStatus.contentHash
				: ('' as ContentHash);

		this._draftStatus.set({
			kind: DraftStatusKind.CONFLICTED,
			contentHash: localHash,
			actualHash: node.contentHash,
			revision: this.nextRevision()
		});
		return failure(this.buildForceWriteError(DocumentForceWriteErrorKind.CONFLICTED));
	}

	// ============================================================
	// Helpers
	// ============================================================

	private bindModelChangeListener(): IDisposable {
		const disposable: IDisposable = this._model.onDidChangeContent((): void => {
			this.handleModelContentChanged();
		});
		return disposable;
	}

	private applyFreshContentToModel(content: string): void {
		this.hashActivationToken = this.hashActivationToken + 1;
		this.suppressNextModelChange = true;
		this._model.setValue(content);
	}

	private applyConfigurableOptions(options: EditorConfigurableDocumentOptions): void {
		const newOptions: editor.ITextModelUpdateOptions = {
			tabSize: options.tabSize,
			insertSpaces: options.insertSpaces
		};
		this._model.updateOptions(newOptions);
	}

	private nextRevision(): DraftRevision {
		this.revisionCounter = this.revisionCounter + 1;
		const revision: DraftRevision = { value: this.revisionCounter };
		return revision;
	}

	private async enqueue<T>(operation: () => Promise<T>): Promise<T> {
		const nextChain: Promise<T> = this.operationChain.then((): Promise<T> => operation());
		this.operationChain = nextChain.then(
			(): void => undefined,
			(): void => undefined
		);
		return nextChain;
	}

	private incrementPendingSave(): void {
		this.pendingSaveCount = this.pendingSaveCount + 1;
		if (this.pendingSaveCount === 1) {
			this._pendingSave.set(true);
		}
	}

	private decrementPendingSave(): void {
		this.pendingSaveCount = this.pendingSaveCount - 1;
		if (this.pendingSaveCount === 0) {
			this._pendingSave.set(false);
		}
	}

	private buildSaveError(kind: DocumentSaveErrorKind, extraMessage?: string): DocumentSaveError {
		const message: string = this.resolveSaveErrorMessage(kind, extraMessage);
		const error: DocumentSaveError = {
			kind: kind,
			message: message
		};
		return error;
	}

	private buildForceWriteError(
		kind: DocumentForceWriteErrorKind,
		extraMessage?: string
	): DocumentForceWriteError {
		const message: string = this.resolveForceWriteErrorMessage(kind, extraMessage);
		const error: DocumentForceWriteError = {
			kind: kind,
			message: message
		};
		return error;
	}

	private buildRevertError(kind: DocumentRevertErrorKind): DocumentRevertError {
		const message: string = this.resolveRevertErrorMessage(kind);
		const error: DocumentRevertError = {
			kind: kind,
			message: message
		};
		return error;
	}

	private resolveSaveErrorMessage(
		kind: DocumentSaveErrorKind,
		extraMessage: string | undefined
	): string {
		if (kind === DocumentSaveErrorKind.CONFLICTED) {
			return ErrorMessages.CONFLICTED(this.nodeID);
		}
		if (kind === DocumentSaveErrorKind.INVALID) {
			return ErrorMessages.INVALID(this.nodeID);
		}
		if (kind === DocumentSaveErrorKind.READ_ONLY) {
			return ErrorMessages.READ_ONLY(this.nodeID);
		}
		if (kind === DocumentSaveErrorKind.DISPOSED) {
			return ErrorMessages.DISPOSED(this.nodeID);
		}
		return ErrorMessages.PORT_WRITE_FAILED(this.nodeID, extraMessage ?? 'unknown');
	}

	private resolveForceWriteErrorMessage(
		kind: DocumentForceWriteErrorKind,
		extraMessage: string | undefined
	): string {
		if (kind === DocumentForceWriteErrorKind.NOT_CONFLICTED) {
			return ErrorMessages.NOT_CONFLICTED(this.nodeID);
		}
		if (kind === DocumentForceWriteErrorKind.INVALID) {
			return ErrorMessages.INVALID(this.nodeID);
		}
		if (kind === DocumentForceWriteErrorKind.READ_ONLY) {
			return ErrorMessages.READ_ONLY(this.nodeID);
		}
		if (kind === DocumentForceWriteErrorKind.CONFLICTED) {
			return ErrorMessages.CONFLICTED(this.nodeID);
		}
		if (kind === DocumentForceWriteErrorKind.DISPOSED) {
			return ErrorMessages.DISPOSED(this.nodeID);
		}
		return ErrorMessages.PORT_WRITE_FAILED(this.nodeID, extraMessage ?? 'unknown');
	}

	private resolveRevertErrorMessage(kind: DocumentRevertErrorKind): string {
		if (kind === DocumentRevertErrorKind.INVALID) {
			return ErrorMessages.INVALID(this.nodeID);
		}
		if (kind === DocumentRevertErrorKind.DISPOSED) {
			return ErrorMessages.DISPOSED(this.nodeID);
		}
		return ErrorMessages.PORT_READ_FAILED(this.nodeID);
	}

}

function deriveInitialDraftStatus(
	contentHash: ContentHash,
	actualHash: ContentHash,
	baseHash: ContentHash,
	allocateRevision: () => DraftRevision
): DraftStatus {
	if (actualHash !== baseHash) {
		return {
			kind: DraftStatusKind.CONFLICTED,
			contentHash: contentHash,
			actualHash: actualHash,
			revision: allocateRevision()
		};
	}
	if (contentHash === baseHash) {
		return CLEAN_STATUS;
	}
	return {
		kind: DraftStatusKind.SAVEABLE,
		contentHash: contentHash,
		revision: allocateRevision()
	};
}
