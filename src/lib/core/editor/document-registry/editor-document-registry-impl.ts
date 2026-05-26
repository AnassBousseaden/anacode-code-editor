import { type Readable, type Unsubscriber, writable, type Writable } from 'svelte/store';

import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type {
	EditorDocumentRegistryChange,
	IEditorDocumentRegistry
} from '$lib/core/editor/document-registry/editor-document-registry';
import { EditorDocumentRegistryChangeType } from '$lib/core/editor/document-registry/editor-document-registry';
import type {
	EditorModelConfiguration,
	IEditorConfigurationService
} from '$lib/core/editor/configuration/editor-config-models';
import { StaticDefaultEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
import type { IDocumentCache } from '$lib/core/editor/document-registry/cache/editor-document-cache';
import { DocumentCache } from '$lib/core/editor/document-registry/cache/editor-document-cache-impl';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { TransactionListener } from '$lib/core/shared/models-utils';

export class EditorDocumentRegistry implements IEditorDocumentRegistry {
	readonly documents: Readable<ReadonlyMap<NodeID, ISavableEditorDocument>>;

	private readonly _documents: Writable<ReadonlyMap<NodeID, ISavableEditorDocument>>;
	private readonly cache: IDocumentCache;
	private readonly listeners: Set<TransactionListener<EditorDocumentRegistryChange>>;
	private readonly configSubscription: Unsubscriber;
	private currentModelConfig: EditorModelConfiguration | null;

	public constructor(
		editorConfigurationService: IEditorConfigurationService = new StaticDefaultEditorConfigurationService()
	) {
		this.cache = new DocumentCache();
		this._documents = writable<ReadonlyMap<NodeID, ISavableEditorDocument>>(this.cache.snapshot());
		this.documents = this._documents;
		this.listeners = new Set<TransactionListener<EditorDocumentRegistryChange>>();
		this.currentModelConfig = null;
		this.configSubscription = editorConfigurationService.editorModelConfig.subscribe(
			(config: EditorModelConfiguration): void => {
				this.currentModelConfig = config;
				this.applyConfigToAllDocuments(config);
			}
		);
	}

	public onTransaction(listener: TransactionListener<EditorDocumentRegistryChange>): Unsubscriber {
		this.listeners.add(listener);

		const unsubscriber: Unsubscriber = (): void => {
			this.listeners.delete(listener);
		};

		return unsubscriber;
	}

	public get(nodeID: NodeID): ISavableEditorDocument | null {
		return this.cache.get(nodeID);
	}

	public set(nodeID: NodeID, document: ISavableEditorDocument): void {
		const previousDocument: ISavableEditorDocument | null = this.cache.get(nodeID);
		this.applyCurrentConfig(document);
		const replacedDocument: ISavableEditorDocument | null = this.cache.set(nodeID, document);

		if (replacedDocument !== null) {
			replacedDocument.dispose();
		}

		this.publishDocuments();
		this.notifyListeners({
			type: EditorDocumentRegistryChangeType.SET,
			nodeID: nodeID,
			document: document,
			previousDocument: previousDocument
		});
	}

	public delete(nodeID: NodeID): void {
		const previousDocument: ISavableEditorDocument | null = this.cache.delete(nodeID);

		if (previousDocument === null) {
			return;
		}

		previousDocument.dispose();
		this.publishDocuments();
		this.notifyListeners({
			type: EditorDocumentRegistryChangeType.DELETED,
			nodeID: nodeID,
			previousDocument: previousDocument
		});
	}

	public dispose(): void {
		this.configSubscription();
		const documents: ReadonlyMap<NodeID, ISavableEditorDocument> = this.cache.snapshot();
		documents.forEach((document: ISavableEditorDocument): void => {
			document.dispose();
		});
		this.cache.clear();
		this.publishDocuments();
		this.listeners.clear();
	}

	private applyCurrentConfig(document: ISavableEditorDocument): void {
		if (this.currentModelConfig === null) {
			return;
		}

		document.updateOptions({ tabSize: this.currentModelConfig.tabSize });
	}

	private applyConfigToAllDocuments(config: EditorModelConfiguration): void {
		const documents: ReadonlyMap<NodeID, ISavableEditorDocument> = this.cache.snapshot();
		documents.forEach((document: ISavableEditorDocument): void => {
			document.updateOptions({ tabSize: config.tabSize });
		});
	}

	private publishDocuments(): void {
		this._documents.set(this.cache.snapshot());
	}

	private notifyListeners(change: EditorDocumentRegistryChange): void {
		for (const listener of this.listeners) {
			listener(change);
		}
	}
}
