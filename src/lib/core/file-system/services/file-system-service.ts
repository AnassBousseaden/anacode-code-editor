import type { Readable } from 'svelte/store';
import {
	type ContentHash,
	type FileSystemEvent,
	type FileSystemMapReadonly,
	type FileSystemNode,
	type FileSystemWriteOrigin,
	type NodeID,
	type OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { ITransactionEventSource, Result } from '$lib/core/shared/models-utils';

/**
 * Read-only view of file-system structure.
 *
 * Emits only on structural events (NODE_CREATED, NODE_DELETED, NODE_MOVED,
 * NODE_RENAMED). Content writes do not trigger emission. Consumers that need
 * to react to "the tree shape changed" subscribe here.
 */
export interface IObservableFileSystemState {
	readonly fileSystemMap: Readable<FileSystemMapReadonly>;
}

export interface IFileSystemService
	extends IObservableFileSystemState, ITransactionEventSource<FileSystemEvent> {

	// --- Actions ---
	createFile(parentID: NodeID, name: string): Promise<Result<NodeID, OperationError>>;

	createFolder(parentID: NodeID, name: string): Promise<Result<NodeID, OperationError>>;

	renameNode(nodeID: NodeID, newName: string): Promise<Result<void, OperationError>>;

	deleteNode(nodeID: NodeID): Promise<Result<void, OperationError>>;

	moveNode(nodeID: NodeID, newParentID: NodeID): Promise<Result<void, OperationError>>;

	updateContent(
		fileID: NodeID,
		content: string,
		origin: FileSystemWriteOrigin
	): Promise<Result<void, OperationError>>;

	updateContentIf(
		fileID: NodeID,
		content: string,
		origin: FileSystemWriteOrigin,
		targetHash: ContentHash
	): Promise<Result<void, OperationError>>;

	// --- Queries ---
	canMoveNode(nodeID: NodeID, targetParentID: NodeID): boolean;

	getNode(nodeID: NodeID): FileSystemNode | null;

	getStateSnapshot(): FileSystemMapReadonly;

	getInsertionParentID(targetID: NodeID | null): NodeID;

	getAbsolutePath(nodeID: NodeID): string;

	// --- LifeCycle ---
	destroy(): void;
}
