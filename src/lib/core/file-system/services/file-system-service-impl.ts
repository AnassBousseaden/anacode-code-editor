import { type Readable, type Unsubscriber, writable, type Writable } from 'svelte/store';
import type { Result } from '$lib/core/shared/models-utils';
import {
	type AtomicEventPayload,
	type ContentHash,
	type FileSystemCommand,
	type FileSystemEvent,
	FileSystemEventType,
	type FileSystemMapReadonly,
	type FileSystemNode,
	type FileSystemPlan,
	type FileSystemWriteOrigin,
	type IFileSystemEngine,
	isFolderNode,
	type NodeCreatedEvent,
	type NodeID,
	type OperationError,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type {
	IFileSystemCommandFactory
} from '$lib/core/file-system/services/command-factory/file-system-command-factory';
import { invalid, valid } from '$lib/core/file-system/domain/file-system-computation-models';

/**
 * Default set of structural events that trigger store updates.
 * Content updates are excluded as they don't affect tree structure.
 */
const DEFAULT_STRUCTURAL_EVENTS: Set<FileSystemEventType> = new Set<FileSystemEventType>([
	FileSystemEventType.NODE_CREATED,
	FileSystemEventType.NODE_DELETED,
	FileSystemEventType.NODE_MOVED,
	FileSystemEventType.NODE_RENAMED
]);

/**
 * Error messages for service operations.
 */
const ServiceErrorMessages = {
	CREATION_NO_NODE: (): string =>
		'System Error: Creation command succeeded but no node was created.'
} as const;

/**
 * FileSystemService - The Application Service Layer.
 *
 * Provides a high-level API for file system operations, abstracting
 * the underlying Engine and Command patterns from consumers.
 *
 * Responsibilities:
 * - Translates user actions into Commands via CommandFactory
 * - Dispatches Commands to the Engine
 * - Maintains a reactive store of file system state
 * - Filters transaction events for relevant structural changes
 * - Provides query methods for accessing nodes
 *
 * Dependencies:
 * - IFileSystemEngine: Executes handlers and manages state
 * - IFileSystemCommandFactory: Creates command data objects
 */
export class FileSystemService implements IFileSystemService {
	private readonly fileSystemEngine: IFileSystemEngine;
	private readonly commandFactory: IFileSystemCommandFactory;
	private readonly relevantEvents: Set<FileSystemEventType>;

	private readonly _fileSystemMap: Writable<FileSystemMapReadonly>;
	private readonly unsubscribeTransaction: Unsubscriber;

	public constructor(
		fileSystemEngine: IFileSystemEngine,
		commandFactory: IFileSystemCommandFactory,
		relevantEvents: Set<FileSystemEventType> = DEFAULT_STRUCTURAL_EVENTS
	) {
		this.fileSystemEngine = fileSystemEngine;
		this.commandFactory = commandFactory;
		this.relevantEvents = relevantEvents;

		// Initialize with current fileSystemEngine state
		const initialState: FileSystemMapReadonly = this.fileSystemEngine.state;
		this._fileSystemMap = writable<FileSystemMapReadonly>(initialState);

		// Subscribe to Engine Transactions
		const transactionHandler: (event: FileSystemEvent) => void = this.createTransactionHandler();
		this.unsubscribeTransaction = this.fileSystemEngine.onTransaction(transactionHandler);
	}

	/**
	 * Reactive store of the file system state.
	 * Updates when relevant structural events occur.
	 */
	public get fileSystemMap(): Readable<FileSystemMapReadonly> {
		return this._fileSystemMap;
	}

	// --- Actions ---

	public async createFile(parentID: NodeID, name: string): Promise<Result<NodeID, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createCreateFileCommand(parentID, name);
		const result: Result<NodeID, OperationError> = await this.executeCreation(command);
		return result;
	}

	public async createFolder(
		parentID: NodeID,
		name: string
	): Promise<Result<NodeID, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createCreateFolderCommand(
			parentID,
			name
		);
		const result: Result<NodeID, OperationError> = await this.executeCreation(command);
		return result;
	}

	public async renameNode(nodeID: NodeID, newName: string): Promise<Result<void, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createRenameNodeCommand(nodeID, newName);
		const result: Result<void, OperationError> = await this.executeVoid(command);
		return result;
	}

	public async deleteNode(nodeID: NodeID): Promise<Result<void, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createDeleteNodeCommand(nodeID);
		const result: Result<void, OperationError> = await this.executeVoid(command);
		return result;
	}

	public async moveNode(
		nodeID: NodeID,
		newParentID: NodeID
	): Promise<Result<void, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createMoveNodeCommand(
			nodeID,
			newParentID
		);
		const result: Result<void, OperationError> = await this.executeVoid(command);
		return result;
	}

	public async updateContent(
		nodeID: NodeID,
		content: string,
		origin: FileSystemWriteOrigin
	): Promise<Result<void, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createUpdateContentCommand(
			nodeID,
			content,
			origin
		);
		const result: Result<void, OperationError> = await this.executeVoid(command);
		return result;
	}

	public async updateContentIf(
		nodeID: NodeID,
		content: string,
		origin: FileSystemWriteOrigin,
		targetHash: ContentHash
	): Promise<Result<void, OperationError>> {
		const command: FileSystemCommand = this.commandFactory.createUpdateContentIfCommand(
			nodeID,
			content,
			origin,
			targetHash
		);
		const result: Result<void, OperationError> = await this.executeVoid(command);
		return result;
	}

	// --- Queries ---

	public canMoveNode(nodeID: NodeID, targetParentID: NodeID): boolean {
		const command: FileSystemCommand = this.commandFactory.createMoveNodeCommand(
			nodeID,
			targetParentID
		);
		const result: Result<FileSystemPlan, OperationError> =
			this.fileSystemEngine.canExecute(command);

		return result.ok;
	}

	public getNode(nodeID: NodeID): FileSystemNode | null {
		const currentState: FileSystemMapReadonly = this.fileSystemEngine.state;
		const node: FileSystemNode | undefined = currentState[nodeID];

		if (node === undefined) {
			return null;
		}

		return node;
	}

	public getStateSnapshot(): FileSystemMapReadonly {
		const currentState: FileSystemMapReadonly = this.fileSystemEngine.state;
		return currentState;
	}

	public getInsertionParentID(targetID: NodeID | null): NodeID {
		if (targetID === null) {
			return ROOT_NODE_ID;
		}

		if (targetID === ROOT_NODE_ID) {
			return ROOT_NODE_ID;
		}

		const node: FileSystemNode | null = this.getNode(targetID);

		if (node === null) {
			return ROOT_NODE_ID;
		}

		if (isFolderNode(node)) {
			return targetID;
		}

		const parentID: NodeID | null = node.parentID;

		if (parentID === null) {
			return ROOT_NODE_ID;
		}

		return parentID;
	}

	// --- Lifecycle ---

	public destroy(): void {
		this.unsubscribeTransaction();
	}

	// --- Private Helpers ---

	getAbsolutePath(nodeID: NodeID): string {
		const pathSegments: string[] = [];
		let currentNodeID: NodeID | null = nodeID;

		while (currentNodeID !== null) {
			const node: FileSystemNode | null = this.getNode(currentNodeID);

			if (node === null) {
				break;
			}

			pathSegments.unshift(node.name);
			currentNodeID = node.parentID;
		}
		return '/' + pathSegments.join('/');
	}

	onTransaction(listener: (event: FileSystemEvent) => void): Unsubscriber {
		return this.fileSystemEngine.onTransaction(listener);
	}

	/**
	 * Creates the transaction handler that updates the store
	 * when relevant structural events occur.
	 * Returns arrow function to capture `this` lexically.
	 */
	private createTransactionHandler(): (event: FileSystemEvent) => void {
		return (event: FileSystemEvent): void => {
			const changes: ReadonlyArray<AtomicEventPayload> = event.changes;

			const isRelevant: boolean = changes.some((change: AtomicEventPayload): boolean =>
				this.relevantEvents.has(change.type)
			);

			if (isRelevant) {
				const currentState: FileSystemMapReadonly = this.fileSystemEngine.state;
				this._fileSystemMap.set(currentState);
			}
		};
	}

	/**
	 * Executes a creation command and extracts the created node's ID.
	 */
	private async executeCreation(
		command: FileSystemCommand
	): Promise<Result<NodeID, OperationError>> {
		const result: Result<FileSystemEvent, OperationError> =
			await this.fileSystemEngine.execute(command);

		if (!result.ok) {
			return result;
		}

		const event: FileSystemEvent = result.value;
		const nodeIDResult: Result<NodeID, OperationError> = this.extractNodeID(event);

		return nodeIDResult;
	}

	/**
	 * Executes a command that returns no value.
	 */
	private async executeVoid(command: FileSystemCommand): Promise<Result<void, OperationError>> {
		const result: Result<FileSystemEvent, OperationError> =
			await this.fileSystemEngine.execute(command);

		if (!result.ok) {
			return result;
		}

		return valid(undefined);
	}

	/**
	 * Extracts the created node's ID from a FileSystemEvent.
	 * Used after creation handlers to return the new node's ID.
	 */
	private extractNodeID(event: FileSystemEvent): Result<NodeID, OperationError> {
		const changes: ReadonlyArray<AtomicEventPayload> = event.changes;

		const createdEvent: AtomicEventPayload | undefined = changes.find(
			(change: AtomicEventPayload): boolean => change.type === FileSystemEventType.NODE_CREATED
		);

		if (createdEvent === undefined) {
			return invalid(ServiceErrorMessages.CREATION_NO_NODE());
		}

		const nodeCreatedEvent: NodeCreatedEvent = createdEvent as NodeCreatedEvent;
		const nodeID: NodeID = nodeCreatedEvent.node.id;

		return valid(nodeID);
	}
}
