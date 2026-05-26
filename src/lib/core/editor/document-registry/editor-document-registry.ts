import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { Readable } from 'svelte/store';

import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type {
	IDisposable1,
	ITransactionEventSource
} from '$lib/core/shared/models-utils';

export enum EditorDocumentRegistryChangeType {
	SET = 'SET',
	DELETED = 'DELETED'
}

export interface EditorDocumentRegistrySetChange {
	readonly type: EditorDocumentRegistryChangeType.SET;
	readonly nodeID: NodeID;
	readonly document: ISavableEditorDocument;
	readonly previousDocument: ISavableEditorDocument | null;
}

export interface EditorDocumentRegistryDeletedChange {
	readonly type: EditorDocumentRegistryChangeType.DELETED;
	readonly nodeID: NodeID;
	readonly previousDocument: ISavableEditorDocument;
}

export type EditorDocumentRegistryChange =
	| EditorDocumentRegistrySetChange
	| EditorDocumentRegistryDeletedChange;

export interface IObservableEditorDocumentRegistry
	extends ITransactionEventSource<EditorDocumentRegistryChange> {
	readonly documents: Readable<ReadonlyMap<NodeID, ISavableEditorDocument>>;

	get(nodeID: NodeID): ISavableEditorDocument | null;
}

export interface IEditorDocumentRegistry
	extends IObservableEditorDocumentRegistry,
		IDisposable1 {
	set(nodeID: NodeID, document: ISavableEditorDocument): void;
	delete(nodeID: NodeID): void;
}
