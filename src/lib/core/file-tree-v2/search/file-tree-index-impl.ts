import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { writable } from 'svelte/store';

import type {
	AtomicEventPayload,
	FileSystemEvent,
	FileSystemMapReadonly,
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import { FileSystemEventType } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type {
	FileTreeIndexSnapshot,
	IFileTreeIndex
} from '$lib/core/file-tree-v2/search/file-tree-index';

interface IndexedNode {
	readonly id: NodeID;
	readonly lowerName: string;
}

class FileTreeIndexSnapshotImpl implements FileTreeIndexSnapshot {
	private readonly nodesByID: ReadonlyMap<NodeID, IndexedNode>;

	constructor(nodesByID: ReadonlyMap<NodeID, IndexedNode>) {
		this.nodesByID = nodesByID;
	}

	findBySubstring(text: string): ReadonlyArray<NodeID> {
		const lowerText: string = text.toLowerCase();
		const matches: NodeID[] = [];

		for (const node of this.nodesByID.values()) {
			const isMatch: boolean = node.lowerName.includes(lowerText);

			if (isMatch) {
				matches.push(node.id);
			}
		}

		return matches;
	}
}

export class FileTreeIndex implements IFileTreeIndex {
	private readonly indexMap: Map<NodeID, IndexedNode>;
	private readonly _snapshot: Writable<FileTreeIndexSnapshot>;
	private readonly unsubscribeTransaction: Unsubscriber;

	constructor(fileSystemService: IFileSystemService) {
		this.indexMap = new Map<NodeID, IndexedNode>();

		const initialState: FileSystemMapReadonly = fileSystemService.getStateSnapshot();
		this.buildFromState(initialState);

		const initialSnapshot: FileTreeIndexSnapshot = this.createSnapshot();
		this._snapshot = writable<FileTreeIndexSnapshot>(initialSnapshot);

		this.unsubscribeTransaction = fileSystemService.onTransaction((event: FileSystemEvent): void =>
			this.handleTransaction(event)
		);
	}

	public get snapshot(): Readable<FileTreeIndexSnapshot> {
		return this._snapshot;
	}

	public dispose(): void {
		this.unsubscribeTransaction();
		this.indexMap.clear();
	}

	private buildFromState(state: FileSystemMapReadonly): void {
		const nodeIDStrings: string[] = Object.keys(state);

		for (const nodeIDString of nodeIDStrings) {
			const nodeID: NodeID = Number(nodeIDString) as NodeID;
			const node: FileSystemNode | undefined = state[nodeID];

			if (node === undefined) {
				continue;
			}

			const indexedNode: IndexedNode = {
				id: node.id,
				lowerName: node.name.toLowerCase()
			};

			this.indexMap.set(nodeID, indexedNode);
		}
	}

	private handleTransaction(event: FileSystemEvent): void {
		const changes: ReadonlyArray<AtomicEventPayload> = event.changes;
		let hasIndexChange: boolean = false;

		for (const change of changes) {
			const didChange: boolean = this.applyChange(change);

			if (didChange) {
				hasIndexChange = true;
			}
		}

		if (!hasIndexChange) {
			return;
		}

		const snapshot: FileTreeIndexSnapshot = this.createSnapshot();
		this._snapshot.set(snapshot);
	}

	private applyChange(change: AtomicEventPayload): boolean {
		switch (change.type) {
			case FileSystemEventType.NODE_CREATED: {
				const node: FileSystemNode = change.node;
				const indexedNode: IndexedNode = {
					id: node.id,
					lowerName: node.name.toLowerCase()
				};
				this.indexMap.set(change.nodeID, indexedNode);
				return true;
			}

			case FileSystemEventType.NODE_DELETED: {
				this.indexMap.delete(change.nodeID);
				return true;
			}

			case FileSystemEventType.NODE_RENAMED: {
				const existing: IndexedNode | undefined = this.indexMap.get(change.nodeID);

				if (existing === undefined) {
					return false;
				}

				const updated: IndexedNode = {
					id: existing.id,
					lowerName: change.newName.toLowerCase()
				};

				this.indexMap.set(change.nodeID, updated);
				return true;
			}

			case FileSystemEventType.NODE_MOVED: {
				return false;
			}

			case FileSystemEventType.NODE_CONTENT_UPDATED: {
				return false;
			}

			case FileSystemEventType.NODE_PATH_CHANGED: {
				return false;
			}
		}
	}

	private createSnapshot(): FileTreeIndexSnapshot {
		const snapshotMap: ReadonlyMap<NodeID, IndexedNode> = new Map(this.indexMap);
		return new FileTreeIndexSnapshotImpl(snapshotMap);
	}
}
