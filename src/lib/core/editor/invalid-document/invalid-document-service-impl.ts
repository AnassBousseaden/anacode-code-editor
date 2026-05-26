import { type Readable, type Unsubscriber, type Writable, writable, get } from 'svelte/store';

import type {
	DraftStatus,
	DraftRevision,
	ISavableEditorDocument
} from '$lib/core/editor/document/savable-editor-document';
import { DraftStatusKind } from '$lib/core/editor/document/savable-editor-document';
import type { IObservableEditorDocumentRegistry } from '$lib/core/editor/document-registry/editor-document-registry';
import type { CloseIntentError } from '$lib/core/editor/intent/editor-intent-models';
import { CloseIntentErrorKind } from '$lib/core/editor/intent/editor-intent-models';
import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	CloseInvalidDocumentError,
	IInvalidDocumentService
} from '$lib/core/editor/invalid-document/invalid-document-service';
import {
	CloseInvalidDocumentErrorKind,
	CloseInvalidDocumentErrorMessages
} from '$lib/core/editor/invalid-document/invalid-document-service';
import type { InvalidItem } from '$lib/core/editor/invalid-document/invalid-document-models';
import { failure, success, type Result } from '$lib/core/shared/models-utils';

interface DocumentBinding {
	readonly document: ISavableEditorDocument;
	readonly statusUnsubscribe: Unsubscriber;
	currentStatus: DraftStatus;
}

export class InvalidDocumentService implements IInvalidDocumentService {
	public readonly items: Readable<ReadonlyArray<InvalidItem>>;

	private readonly intentCommands: IEditorIntentCommands;
	private readonly itemsStore: Writable<ReadonlyArray<InvalidItem>>;
	private readonly bindings: Map<NodeID, DocumentBinding>;
	private readonly documentsUnsubscribe: Unsubscriber;

	private disposed: boolean;

	public constructor(
		documentRegistry: IObservableEditorDocumentRegistry,
		intentCommands: IEditorIntentCommands
	) {
		this.intentCommands = intentCommands;
		this.bindings = new Map<NodeID, DocumentBinding>();
		this.itemsStore = writable<ReadonlyArray<InvalidItem>>([]);
		this.items = this.itemsStore;
		this.disposed = false;

		this.documentsUnsubscribe = documentRegistry.documents.subscribe(
			(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void => {
				this.reconcileBindings(documents);
			}
		);
	}

	public dispose(): void {
		this.disposed = true;
		this.documentsUnsubscribe();
		for (const binding of this.bindings.values()) {
			binding.statusUnsubscribe();
		}
		this.bindings.clear();
		this.itemsStore.set([]);
	}

	public getItem(nodeID: NodeID): InvalidItem | null {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return null;
		}
		return this.deriveItem(nodeID, binding.currentStatus);
	}

	public async close(
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<Result<void, CloseInvalidDocumentError>> {
		if (this.disposed) {
			return failure(this.buildError(CloseInvalidDocumentErrorKind.DISPOSED));
		}
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return failure(this.buildError(CloseInvalidDocumentErrorKind.NOT_FOUND));
		}
		if (binding.currentStatus.kind !== DraftStatusKind.INVALID) {
			return failure(this.buildError(CloseInvalidDocumentErrorKind.NOT_INVALID));
		}
		if (binding.currentStatus.revision.value !== revision.value) {
			return failure(this.buildError(CloseInvalidDocumentErrorKind.STALE_REVISION));
		}

		const result: Result<void, CloseIntentError> = await this.intentCommands.close(nodeID);
		if (result.ok) {
			return success(undefined);
		}
		const mappedKind: CloseInvalidDocumentErrorKind = this.mapIntentCloseErrorKind(result.error.kind);
		return failure(this.buildError(mappedKind));
	}

	private mapIntentCloseErrorKind(
		kind: CloseIntentErrorKind
	): CloseInvalidDocumentErrorKind {
		switch (kind) {
			case CloseIntentErrorKind.UNSAVED_DRAFT:
				return CloseInvalidDocumentErrorKind.NOT_INVALID;
		}
	}

	private reconcileBindings(documents: ReadonlyMap<NodeID, ISavableEditorDocument>): void {
		const removedNodeIDs: NodeID[] = [];
		for (const nodeID of this.bindings.keys()) {
			if (!documents.has(nodeID)) {
				removedNodeIDs.push(nodeID);
			}
		}
		for (const nodeID of removedNodeIDs) {
			this.tearDownBinding(nodeID);
		}

		for (const [nodeID, document] of documents) {
			if (this.bindings.has(nodeID)) {
				continue;
			}
			this.bindToDocument(nodeID, document);
		}

		this.refreshItems();
	}

	private bindToDocument(nodeID: NodeID, document: ISavableEditorDocument): void {
		const initialStatus: DraftStatus = get(document.draftStatus);
		const statusUnsubscribe: Unsubscriber = document.draftStatus.subscribe(
			(status: DraftStatus): void => {
				this.handleStatusChange(nodeID, status);
			}
		);
		const binding: DocumentBinding = {
			document: document,
			statusUnsubscribe: statusUnsubscribe,
			currentStatus: initialStatus
		};
		this.bindings.set(nodeID, binding);
	}

	private tearDownBinding(nodeID: NodeID): void {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return;
		}
		binding.statusUnsubscribe();
		this.bindings.delete(nodeID);
	}

	private handleStatusChange(nodeID: NodeID, status: DraftStatus): void {
		const binding: DocumentBinding | undefined = this.bindings.get(nodeID);
		if (binding === undefined) {
			return;
		}
		binding.currentStatus = status;
		this.refreshItems();
	}

	private refreshItems(): void {
		const next: InvalidItem[] = [];
		for (const [nodeID, binding] of this.bindings) {
			const item: InvalidItem | null = this.deriveItem(nodeID, binding.currentStatus);
			if (item !== null) {
				next.push(item);
			}
		}
		this.itemsStore.set(next);
	}

	private deriveItem(nodeID: NodeID, status: DraftStatus): InvalidItem | null {
		if (status.kind !== DraftStatusKind.INVALID) {
			return null;
		}
		const item: InvalidItem = {
			nodeID: nodeID,
			revision: status.revision
		};
		return item;
	}

	private buildError(kind: CloseInvalidDocumentErrorKind): CloseInvalidDocumentError {
		return {
			kind: kind,
			message: CloseInvalidDocumentErrorMessages[kind]
		};
	}
}
