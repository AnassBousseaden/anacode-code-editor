import type { Readable } from 'svelte/store';

import type {
	EditorDocumentOpenError,
	EditorDocumentReloadError
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface DocumentOpenFailure {
	readonly nodeID: NodeID;
	readonly error: EditorDocumentOpenError | EditorDocumentReloadError;
	readonly occurredAt: number;
}

export interface IObservableDocumentOpenFailureRegistry {
	readonly failures: Readable<ReadonlyMap<NodeID, DocumentOpenFailure>>;
}

export interface IDocumentOpenFailureWriter {
	record(failure: DocumentOpenFailure): void;
	clear(nodeID: NodeID): void;
	clearAll(): void;
}

export interface IDocumentOpenFailureRegistry
	extends IObservableDocumentOpenFailureRegistry, IDocumentOpenFailureWriter, IDisposable1 {}
