import { type Readable, type Unsubscriber, writable, type Writable } from 'svelte/store';

import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import type { IEditorDocumentRegistry } from '$lib/core/editor/document-registry/editor-document-registry';
import type {
	EditorDocumentLoaderError,
	EditorDocumentLoaderTargetUnavailableError,
	IEditorDocumentProvider
} from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider';
import { EditorDocumentLoaderErrorKind } from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider';
import type {
	DocumentOpenFailure,
	IDocumentOpenFailureWriter
} from '$lib/core/editor/document-lifecycle/open-failure-registry/document-open-failure-registry';
import type {
	EditorDocumentCreationFailedError,
	EditorDocumentEvictError,
	EditorDocumentLifecycleEvent,
	EditorDocumentNotLoadedError,
	EditorDocumentOpenError,
	EditorDocumentReloadError,
	EditorDocumentServiceState,
	EditorDocumentTargetUnavailableError,
	EditorDocumentWillEvictEvent,
	EditorDocumentWillReloadEvent,
	IEditorDocumentService
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import {
	EditorDocumentLifecycleEventType,
	EditorDocumentServiceErrorKind
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import { WaitableCollector } from '$lib/core/shared/lifecycle/editor-lifecycle-waitable';
import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';
import type { Result, TransactionListener } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';

const LOG_SCOPE: string = 'editor-document-service';

const ErrorMessages = {
	NOT_LOADED: (nodeID: NodeID): string => `Node ${nodeID} is not currently loaded`
} as const;

export class EditorDocumentService implements IEditorDocumentService {
	public readonly state: Readable<EditorDocumentServiceState>;

	private readonly _state: Writable<EditorDocumentServiceState>;
	private readonly documentProvider: IEditorDocumentProvider;
	private readonly documentRegistry: IEditorDocumentRegistry;
	private readonly documentOpenFailureWriter: IDocumentOpenFailureWriter;
	private readonly logger: IEditorLogger;
	private readonly documentsUnsubscribe: Unsubscriber;
	private readonly listeners: Set<TransactionListener<EditorDocumentLifecycleEvent>>;

	public constructor(
		editorDocumentProvider: IEditorDocumentProvider,
		editorDocumentRegistry: IEditorDocumentRegistry,
		documentOpenFailureWriter: IDocumentOpenFailureWriter,
		logger: IEditorLogger
	) {
		this.documentProvider = editorDocumentProvider;
		this.documentRegistry = editorDocumentRegistry;
		this.documentOpenFailureWriter = documentOpenFailureWriter;
		this.logger = logger;
		this.listeners = new Set<TransactionListener<EditorDocumentLifecycleEvent>>();

		const initialState: EditorDocumentServiceState = {
			loadedDocumentCount: 0
		};

		this._state = writable<EditorDocumentServiceState>(initialState);
		this.state = this._state;
		this.documentsUnsubscribe = this.documentRegistry.documents.subscribe(
			(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void => {
				this.publishState(documents.size);
			}
		);
	}

	public onTransaction(listener: TransactionListener<EditorDocumentLifecycleEvent>): Unsubscriber {
		this.listeners.add(listener);

		const unsubscriber: Unsubscriber = (): void => {
			this.listeners.delete(listener);
		};

		return unsubscriber;
	}

	public async open(nodeID: NodeID): Promise<Result<IEditorDocument, EditorDocumentOpenError>> {
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'open.requested',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});

		let result: Result<IEditorDocument, EditorDocumentOpenError>;
		const existingDocument: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);

		if (existingDocument !== null) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'open.cache_hit',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			result = success(existingDocument);
		} else {
			const optionsResult: Result<
				SavableEditorDocumentOptions,
				EditorDocumentLoaderTargetUnavailableError
			> = this.documentProvider.resolveOptionsFromFS(nodeID);

			if (!optionsResult.ok) {
				result = failure(mapTargetUnavailable(optionsResult.error));
			} else {
				const loadResult: Result<ISavableEditorDocument, EditorDocumentLoaderError> =
					await this.documentProvider.load(nodeID, optionsResult.value);

				if (!loadResult.ok) {
					result = failure(mapLoaderError(loadResult.error));
				} else {
					const loadedDocument: ISavableEditorDocument = loadResult.value;
					this.documentRegistry.set(nodeID, loadedDocument);
					this.emitEvent({
						type: EditorDocumentLifecycleEventType.DOCUMENT_DID_OPEN,
						nodeID: nodeID,
						document: loadedDocument
					});
					result = success(loadedDocument);
				}
			}
		}

		if (result.ok) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'open.completed',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
		} else {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'open.failed',
				level: EditorLogLevel.WARN,
				data: {
					nodeID: nodeID,
					errorKind: result.error.kind,
					errorMessage: result.error.message
				}
			});
		}

		syncDocumentOpenFailure(this.documentOpenFailureWriter, nodeID, result);
		return result;
	}

	public async reload(nodeID: NodeID): Promise<Result<IEditorDocument, EditorDocumentReloadError>> {
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'reload.requested',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});

		const existingDocument: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);

		if (existingDocument === null) {
			const notLoadedError: EditorDocumentNotLoadedError = createNotLoadedError(nodeID);
			const result: Result<IEditorDocument, EditorDocumentReloadError> = failure(notLoadedError);
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'reload.not_loaded',
				level: EditorLogLevel.WARN,
				data: { nodeID: nodeID }
			});
			syncDocumentOpenFailure(this.documentOpenFailureWriter, nodeID, result);
			return result;
		}

		const fsOptionsResult: Result<
			SavableEditorDocumentOptions,
			EditorDocumentLoaderTargetUnavailableError
		> = this.documentProvider.resolveOptionsFromFS(nodeID);

		if (!fsOptionsResult.ok) {
			const reloadError: EditorDocumentReloadError = mapTargetUnavailable(fsOptionsResult.error);
			const result: Result<IEditorDocument, EditorDocumentReloadError> = failure(reloadError);
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'reload.failed',
				level: EditorLogLevel.WARN,
				data: {
					nodeID: nodeID,
					errorKind: reloadError.kind,
					errorMessage: reloadError.message
				}
			});
			this.emitEvent({
				type: EditorDocumentLifecycleEventType.DOCUMENT_DID_FAIL_RELOAD,
				nodeID: nodeID,
				error: reloadError
			});
			syncDocumentOpenFailure(this.documentOpenFailureWriter, nodeID, result);
			return result;
		}

		const previousOptions: SavableEditorDocumentOptions = existingDocument.getDocumentOptions();
		const reloadOptions: SavableEditorDocumentOptions = {
			fileURI: fsOptionsResult.value.fileURI,
			isReadOnly: fsOptionsResult.value.isReadOnly,
			content: previousOptions.content,
			baseHash: previousOptions.baseHash
		};

		const willCollector: WaitableCollector = new WaitableCollector(
			this.logger,
			EditorDocumentLifecycleEventType.DOCUMENT_WILL_RELOAD
		);
		const willEvent: EditorDocumentWillReloadEvent = {
			type: EditorDocumentLifecycleEventType.DOCUMENT_WILL_RELOAD,
			nodeID: nodeID,
			waitUntil: willCollector.waitUntil
		};
		this.emitEvent(willEvent);
		await willCollector.awaitAll();

		this.documentRegistry.delete(nodeID);
		existingDocument.dispose();

		const loadResult: Result<ISavableEditorDocument, EditorDocumentLoaderError> =
			await this.documentProvider.load(nodeID, reloadOptions);

		if (!loadResult.ok) {
			const reloadError: EditorDocumentReloadError = mapLoaderError(loadResult.error);
			const result: Result<IEditorDocument, EditorDocumentReloadError> = failure(reloadError);
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'reload.failed',
				level: EditorLogLevel.WARN,
				data: {
					nodeID: nodeID,
					errorKind: reloadError.kind,
					errorMessage: reloadError.message
				}
			});
			this.emitEvent({
				type: EditorDocumentLifecycleEventType.DOCUMENT_DID_FAIL_RELOAD,
				nodeID: nodeID,
				error: reloadError
			});
			syncDocumentOpenFailure(this.documentOpenFailureWriter, nodeID, result);
			return result;
		}

		const loadedDocument: ISavableEditorDocument = loadResult.value;
		this.documentRegistry.set(nodeID, loadedDocument);

		const result: Result<IEditorDocument, EditorDocumentReloadError> = success(loadedDocument);
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'reload.completed',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});
		this.emitEvent({
			type: EditorDocumentLifecycleEventType.DOCUMENT_DID_RELOAD,
			nodeID: nodeID,
			document: loadedDocument
		});
		syncDocumentOpenFailure(this.documentOpenFailureWriter, nodeID, result);
		return result;
	}

	public async evict(nodeID: NodeID): Promise<Result<boolean, EditorDocumentEvictError>> {
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'evict.requested',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});

		const existingDocument: ISavableEditorDocument | null = this.documentRegistry.get(nodeID);

		if (existingDocument === null) {
			this.logger.log({
				scope: LOG_SCOPE,
				event: 'evict.no_op',
				level: EditorLogLevel.INFO,
				data: { nodeID: nodeID }
			});
			this.documentOpenFailureWriter.clear(nodeID);
			return success(false);
		}

		const willCollector: WaitableCollector = new WaitableCollector(
			this.logger,
			EditorDocumentLifecycleEventType.DOCUMENT_WILL_EVICT
		);
		const willEvent: EditorDocumentWillEvictEvent = {
			type: EditorDocumentLifecycleEventType.DOCUMENT_WILL_EVICT,
			nodeID: nodeID,
			waitUntil: willCollector.waitUntil
		};
		this.emitEvent(willEvent);
		await willCollector.awaitAll();

		this.documentRegistry.delete(nodeID);
		existingDocument.dispose();
		this.logger.log({
			scope: LOG_SCOPE,
			event: 'evict.completed',
			level: EditorLogLevel.INFO,
			data: { nodeID: nodeID }
		});
		this.emitEvent({
			type: EditorDocumentLifecycleEventType.DOCUMENT_DID_EVICT,
			nodeID: nodeID
		});
		this.documentOpenFailureWriter.clear(nodeID);

		return success(true);
	}

	public getLoaded(nodeID: NodeID): ISavableEditorDocument | null {
		return this.documentRegistry.get(nodeID);
	}

	public dispose(): void {
		this.documentsUnsubscribe();
		this.listeners.clear();
	}

	private publishState(loadedDocumentCount: number): void {
		const newState: EditorDocumentServiceState = {
			loadedDocumentCount: loadedDocumentCount
		};

		this._state.set(newState);
	}

	private emitEvent(event: EditorDocumentLifecycleEvent): void {
		for (const listener of this.listeners) {
			try {
				listener(event);
			} catch (error: unknown) {
				const message: string = error instanceof Error ? error.message : String(error);
				this.logger.log({
					scope: LOG_SCOPE,
					event: 'listener.threw',
					level: EditorLogLevel.WARN,
					data: {
						eventType: event.type,
						message: message
					}
				});
			}
		}
	}
}

function mapTargetUnavailable(
	unavailableError: EditorDocumentLoaderTargetUnavailableError
): EditorDocumentTargetUnavailableError {
	return {
		kind: EditorDocumentServiceErrorKind.TARGET_UNAVAILABLE,
		message: unavailableError.message,
		nodeID: unavailableError.nodeID,
		reason: unavailableError.reason
	};
}

function mapLoaderError(loaderError: EditorDocumentLoaderError): EditorDocumentOpenError {
	if (loaderError.kind === EditorDocumentLoaderErrorKind.TARGET_UNAVAILABLE) {
		return mapTargetUnavailable(loaderError);
	}

	const error: EditorDocumentCreationFailedError = {
		kind: EditorDocumentServiceErrorKind.DOCUMENT_CREATION_FAILED,
		message: loaderError.message,
		nodeID: loaderError.nodeID
	};
	return error;
}

function createNotLoadedError(nodeID: NodeID): EditorDocumentNotLoadedError {
	const error: EditorDocumentNotLoadedError = {
		kind: EditorDocumentServiceErrorKind.NOT_LOADED,
		message: ErrorMessages.NOT_LOADED(nodeID),
		nodeID: nodeID
	};
	return error;
}

function syncDocumentOpenFailure(
	documentOpenFailureWriter: IDocumentOpenFailureWriter,
	nodeID: NodeID,
	result: Result<IEditorDocument, EditorDocumentOpenError | EditorDocumentReloadError>
): void {
	if (result.ok) {
		documentOpenFailureWriter.clear(nodeID);
		return;
	}

	const failureEntry: DocumentOpenFailure = {
		nodeID: nodeID,
		error: result.error,
		occurredAt: Date.now()
	};
	documentOpenFailureWriter.record(failureEntry);
}
