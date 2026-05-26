import { get, type Readable, writable, type Writable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	DocumentOpenFailure,
	IDocumentOpenFailureRegistry
} from '$lib/core/editor/document-lifecycle/open-failure-registry/document-open-failure-registry';

type DocumentOpenFailureMap = ReadonlyMap<NodeID, DocumentOpenFailure>;

export class DocumentOpenFailureRegistry implements IDocumentOpenFailureRegistry {
	public readonly failures: Readable<DocumentOpenFailureMap>;

	private readonly _failures: Writable<DocumentOpenFailureMap>;

	public constructor() {
		const initialFailures: DocumentOpenFailureMap = new Map<NodeID, DocumentOpenFailure>();
		this._failures = writable<DocumentOpenFailureMap>(initialFailures);
		this.failures = this._failures;
	}

	public record(failure: DocumentOpenFailure): void {
		const currentFailures: DocumentOpenFailureMap = get(this._failures);
		const nextFailures: Map<NodeID, DocumentOpenFailure> = new Map<NodeID, DocumentOpenFailure>(
			currentFailures
		);

		nextFailures.set(failure.nodeID, failure);
		this._failures.set(nextFailures);
	}

	public clear(nodeID: NodeID): void {
		const currentFailures: DocumentOpenFailureMap = get(this._failures);

		if (!currentFailures.has(nodeID)) {
			return;
		}

		const nextFailures: Map<NodeID, DocumentOpenFailure> = new Map<NodeID, DocumentOpenFailure>(
			currentFailures
		);
		nextFailures.delete(nodeID);
		this._failures.set(nextFailures);
	}

	public clearAll(): void {
		const emptyFailures: DocumentOpenFailureMap = new Map<NodeID, DocumentOpenFailure>();
		this._failures.set(emptyFailures);
	}

	public dispose(): void {
		this.clearAll();
	}
}
