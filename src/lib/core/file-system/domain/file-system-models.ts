export type { OperationError } from '$lib/core/shared/models-utils';

import type {
	Brand,
	ITransactionEventSource,
	OperationError,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';

export type NodeID = Brand<number, 'NodeID'>;

export type UserSpaceTag = Brand<string, 'UserSpaceTag'>;

export type FileSystemWriteOrigin = Brand<string, 'FileSystemWriteOrigin'>;

export type FileSystemPath = Brand<string, 'FileSystemPath'>;

export type FileSystemNamespace = Brand<string, 'FileSystemNamespace'>;

export type ContentHash = Brand<string, 'ContentHash'>;

export const EMPTY_CONTENT_HASH: ContentHash = '' as ContentHash;

export enum NodeType {
	FILE = 'FILE',
	FOLDER = 'FOLDER'
}

export enum CommandType {
	CREATE_FILE = 'CREATE_FILE',
	CREATE_FOLDER = 'CREATE_FOLDER',
	DELETE_NODE = 'DELETE_NODE',
	RENAME_NODE = 'RENAME_NODE',
	MOVE_NODE = 'MOVE_NODE',
	UPDATE_CONTENT = 'UPDATE_CONTENT',
	UPDATE_CONTENT_IF = 'UPDATE_CONTENT_IF'
}

export enum FileSystemPlanType {
	NODE_CREATE = 'NODE_CREATE',
	NODE_DELETE = 'NODE_DELETE',
	NODE_RENAME = 'NODE_RENAME',
	NODE_MOVE = 'NODE_MOVE',
	NODE_CONTENT_UPDATED = 'NODE_CONTENT_UPDATED'
}

export enum FileSystemEventType {
	NODE_CREATED = 'NODE_CREATED',
	NODE_CONTENT_UPDATED = 'NODE_CONTENT_UPDATED',
	NODE_DELETED = 'NODE_DELETED',
	NODE_RENAMED = 'NODE_RENAMED',
	NODE_MOVED = 'NODE_MOVED',
	NODE_PATH_CHANGED = 'NODE_PATH_CHANGED'
}

export const ROOT_NODE_ID: NodeID = 0 as NodeID;

export interface NodePermissions {
	readonly read: boolean;
	readonly write: boolean;
	readonly delete: boolean;
	readonly rename: boolean;
}

export const DEFAULT_PERMISSIONS: NodePermissions = {
	read: true,
	write: true,
	delete: true,
	rename: true
};

export const LOCKED_PERMISSIONS: NodePermissions = {
	read: true,
	write: false,
	delete: false,
	rename: false
};

export const ROOT_PERMISSIONS: NodePermissions = {
	read: true,
	write: true,
	delete: false,
	rename: false
};

export interface BaseNodeSpec {
	readonly id: NodeID;
	readonly parentID: NodeID | null;
	readonly name: string;
	readonly permissions: NodePermissions;
	readonly userSpace: UserSpaceTag | null;
}

export interface FileNodeSpec extends BaseNodeSpec {
	readonly type: NodeType.FILE;
	readonly content: string;
}

export interface FolderNodeSpec extends BaseNodeSpec {
	readonly type: NodeType.FOLDER;
}

export type FileSystemNodeSpec = FileNodeSpec | FolderNodeSpec;

export function isFileNodeSpec(node: FileSystemNodeSpec): node is FileNodeSpec {
	return node.type === NodeType.FILE;
}

export function isFolderNodeSpec(node: FileSystemNodeSpec): node is FolderNodeSpec {
	return node.type === NodeType.FOLDER;
}

interface BaseNode {
	readonly id: NodeID;
	readonly parentID: NodeID | null;
	readonly name: string;
	readonly path: FileSystemPath;
	readonly permissions: NodePermissions;
	readonly userSpace: UserSpaceTag | null;
}

export interface FileNode extends BaseNode {
	readonly type: NodeType.FILE;
	readonly content: string;
	readonly contentHash: ContentHash;
}

export interface FolderNode extends BaseNode {
	readonly type: NodeType.FOLDER;
	readonly children: ReadonlyArray<NodeID>;
}

export type FileSystemNode = FileNode | FolderNode;

export function isFileNode(node: FileSystemNode): node is FileNode {
	return node.type === NodeType.FILE;
}

export function isFolderNode(node: FileSystemNode): node is FolderNode {
	return node.type === NodeType.FOLDER;
}

export type FileSystemMap = Record<NodeID, FileSystemNode>;

export type FileSystemMapReadonly = Readonly<FileSystemMap>;

export interface FileSystemPlanBase {
	readonly type: FileSystemPlanType;
}

export interface NodeCreatePlan extends FileSystemPlanBase {
	readonly type: FileSystemPlanType.NODE_CREATE;
	readonly node: FileSystemNodeSpec;
}

export interface NodeDeletePlan extends FileSystemPlanBase {
	readonly type: FileSystemPlanType.NODE_DELETE;
	readonly nodeID: NodeID;
}

export interface NodeRenamePlan extends FileSystemPlanBase {
	readonly type: FileSystemPlanType.NODE_RENAME;
	readonly nodeID: NodeID;
	readonly oldName: string;
	readonly newName: string;
}

export interface NodeMovePlan extends FileSystemPlanBase {
	readonly type: FileSystemPlanType.NODE_MOVE;
	readonly nodeID: NodeID;
	readonly oldParentID: NodeID;
	readonly newParentID: NodeID;
}

export interface NodeContentUpdatedPlan extends FileSystemPlanBase {
	readonly type: FileSystemPlanType.NODE_CONTENT_UPDATED;
	readonly nodeID: NodeID;
	readonly oldContent: string;
	readonly newContent: string;
	readonly origin: FileSystemWriteOrigin;
}

export type AtomicPlanPayload =
	| NodeCreatePlan
	| NodeDeletePlan
	| NodeRenamePlan
	| NodeMovePlan
	| NodeContentUpdatedPlan;

export interface FileSystemPlan {
	readonly description: string;
	readonly changes: ReadonlyArray<AtomicPlanPayload>;
}

export type EventID = Brand<string, 'EventID'>;

export interface FileSystemEventBase {
	readonly type: FileSystemEventType;
	readonly nodeID: NodeID;
	readonly timestamp: number;
}

export interface NodeCreatedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_CREATED;
	readonly node: FileSystemNode;
}

export interface NodeUpdatedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_CONTENT_UPDATED;
	readonly before: FileNode;
	readonly after: FileNode;
	readonly origin: FileSystemWriteOrigin;
}

export interface NodeDeletedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_DELETED;
	readonly node: FileSystemNode;
}

export interface NodeRenamedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_RENAMED;
	readonly before: FileSystemNode;
	readonly after: FileSystemNode;
	readonly oldName: string;
	readonly newName: string;
}

export interface NodeMovedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_MOVED;
	readonly before: FileSystemNode;
	readonly after: FileSystemNode;
	readonly oldParentID: NodeID;
	readonly newParentID: NodeID;
}

export interface NodePathChangedEvent extends FileSystemEventBase {
	readonly type: FileSystemEventType.NODE_PATH_CHANGED;
	readonly before: FileSystemNode;
	readonly after: FileSystemNode;
	readonly oldPath: FileSystemPath;
	readonly newPath: FileSystemPath;
}

export type AtomicEventPayload =
	| NodeCreatedEvent
	| NodeUpdatedEvent
	| NodeDeletedEvent
	| NodeRenamedEvent
	| NodeMovedEvent
	| NodePathChangedEvent;

export interface FileSystemEvent {
	readonly id: EventID;
	readonly timestamp: number;
	readonly description: string;
	readonly plan: FileSystemPlan;
	readonly changes: ReadonlyArray<AtomicEventPayload>;
}

export interface NodeOperationError extends OperationError {
	readonly nodeID: NodeID;
}

export interface NodeOperationFailure<K extends string>
	extends NodeOperationError, OperationFailure<K> {}

export type ValidationResult<T> = Result<T, OperationError>;

export interface BaseCommand {
	readonly type: CommandType;
}

export interface CreateFileCommand extends BaseCommand {
	readonly type: CommandType.CREATE_FILE;
	readonly parentID: NodeID;
	readonly name: string;
	readonly userSpace: UserSpaceTag | null;
}

export interface CreateFolderCommand extends BaseCommand {
	readonly type: CommandType.CREATE_FOLDER;
	readonly parentID: NodeID;
	readonly name: string;
	readonly userSpace: UserSpaceTag | null;
}

export interface DeleteNodeCommand extends BaseCommand {
	readonly type: CommandType.DELETE_NODE;
	readonly nodeID: NodeID;
}

export interface RenameNodeCommand extends BaseCommand {
	readonly type: CommandType.RENAME_NODE;
	readonly nodeID: NodeID;
	readonly newName: string;
}

export interface MoveNodeCommand extends BaseCommand {
	readonly type: CommandType.MOVE_NODE;
	readonly nodeID: NodeID;
	readonly newParentID: NodeID;
}

export interface UpdateContentCommand extends BaseCommand {
	readonly type: CommandType.UPDATE_CONTENT;
	readonly nodeID: NodeID;
	readonly newContent: string;
	readonly origin: FileSystemWriteOrigin;
}

export interface UpdateContentIfCommand extends BaseCommand {
	readonly type: CommandType.UPDATE_CONTENT_IF;
	readonly nodeID: NodeID;
	readonly newContent: string;
	readonly origin: FileSystemWriteOrigin;
	readonly targetHash: ContentHash;
}

export type FileSystemCommand =
	| CreateFileCommand
	| CreateFolderCommand
	| DeleteNodeCommand
	| RenameNodeCommand
	| MoveNodeCommand
	| UpdateContentCommand
	| UpdateContentIfCommand;

export interface IFileSystemEngine extends ITransactionEventSource<FileSystemEvent> {
	readonly state: FileSystemMapReadonly;

	execute(fileSystemCommand: FileSystemCommand): Promise<Result<FileSystemEvent, OperationError>>;

	canExecute(fileSystemCommand: FileSystemCommand): Result<FileSystemPlan, OperationError>;
}
