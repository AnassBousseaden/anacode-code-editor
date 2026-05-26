import type { NodeID, NodeOperationFailure, OperationError } from '../file-system-models';

export enum FileSystemErrorKind {
	NODE_NOT_FOUND = 'NODE_NOT_FOUND',
	PARENT_NOT_FOUND = 'PARENT_NOT_FOUND',
	PARENT_NOT_FOLDER = 'PARENT_NOT_FOLDER',
	TARGET_NOT_FILE = 'TARGET_NOT_FILE',
	DUPLICATE_NAME = 'DUPLICATE_NAME',
	PERMISSION_DENIED_WRITE = 'PERMISSION_DENIED_WRITE',
	PERMISSION_DENIED_DELETE = 'PERMISSION_DENIED_DELETE',
	PERMISSION_DENIED_RENAME = 'PERMISSION_DENIED_RENAME',
	CANNOT_MOVE_ROOT = 'CANNOT_MOVE_ROOT',
	CYCLE_DETECTED = 'CYCLE_DETECTED',
	MOVE_INTO_SUBTREE = 'MOVE_INTO_SUBTREE',
	DESCENDANT_NOT_DELETABLE = 'DESCENDANT_NOT_DELETABLE'
}

export interface FileSystemOperationFailure extends OperationError {
	readonly kind: FileSystemErrorKind;
}

type NodeNotFoundError = NodeOperationFailure<FileSystemErrorKind.NODE_NOT_FOUND>;

interface ParentNotFoundError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.PARENT_NOT_FOUND;
	readonly parentID: NodeID;
}

interface ParentNotFolderError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.PARENT_NOT_FOLDER;
	readonly parentID: NodeID;
}

type TargetNotFileError = NodeOperationFailure<FileSystemErrorKind.TARGET_NOT_FILE>;

interface DuplicateNameError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.DUPLICATE_NAME;
	readonly name: string;
}

interface PermissionDeniedWriteError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.PERMISSION_DENIED_WRITE;
}

interface PermissionDeniedDeleteError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.PERMISSION_DENIED_DELETE;
}

interface PermissionDeniedRenameError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.PERMISSION_DENIED_RENAME;
}

interface CannotMoveRootError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.CANNOT_MOVE_ROOT;
}

interface CycleDetectedError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.CYCLE_DETECTED;
	readonly childID: NodeID;
	readonly parentID: NodeID;
}

interface MoveIntoSubtreeError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.MOVE_INTO_SUBTREE;
}

interface DescendantNotDeletableError extends FileSystemOperationFailure {
	readonly kind: FileSystemErrorKind.DESCENDANT_NOT_DELETABLE;
	readonly descendantID: NodeID;
}

function createNodeNotFoundError(nodeID: NodeID): NodeNotFoundError {
	return {
		kind: FileSystemErrorKind.NODE_NOT_FOUND,
		message: `Node ${nodeID} does not exist`,
		nodeID
	};
}

function createParentNotFoundError(parentID: NodeID): ParentNotFoundError {
	return {
		kind: FileSystemErrorKind.PARENT_NOT_FOUND,
		message: `Parent folder ${parentID} does not exist`,
		parentID
	};
}

function createParentNotFolderError(parentID: NodeID): ParentNotFolderError {
	return {
		kind: FileSystemErrorKind.PARENT_NOT_FOLDER,
		message: `Node ${parentID} is not a folder`,
		parentID
	};
}

function createTargetNotFileError(nodeID: NodeID): TargetNotFileError {
	return {
		kind: FileSystemErrorKind.TARGET_NOT_FILE,
		message: `Node ${nodeID} is not a file`,
		nodeID
	};
}

function createDuplicateNameError(name: string): DuplicateNameError {
	return {
		kind: FileSystemErrorKind.DUPLICATE_NAME,
		message: `A file or folder named "${name}" already exists in this folder`,
		name
	};
}

function createPermissionDeniedWriteError(): PermissionDeniedWriteError {
	return {
		kind: FileSystemErrorKind.PERMISSION_DENIED_WRITE,
		message: `Write permission denied`
	};
}

function createPermissionDeniedDeleteError(): PermissionDeniedDeleteError {
	return {
		kind: FileSystemErrorKind.PERMISSION_DENIED_DELETE,
		message: `Delete permission denied`
	};
}

function createPermissionDeniedRenameError(): PermissionDeniedRenameError {
	return {
		kind: FileSystemErrorKind.PERMISSION_DENIED_RENAME,
		message: `Rename permission denied`
	};
}

function createCannotMoveRootError(): CannotMoveRootError {
	return {
		kind: FileSystemErrorKind.CANNOT_MOVE_ROOT,
		message: `Cannot move the root node`
	};
}

function createCycleDetectedError(childID: NodeID, parentID: NodeID): CycleDetectedError {
	return {
		kind: FileSystemErrorKind.CYCLE_DETECTED,
		message: `Cannot create edge: would create a cycle between ${childID} and ${parentID}`,
		childID,
		parentID
	};
}

function createMoveIntoSubtreeError(): MoveIntoSubtreeError {
	return {
		kind: FileSystemErrorKind.MOVE_INTO_SUBTREE,
		message: `Cannot move a folder into its own subtree`
	};
}

function createDescendantNotDeletableError(descendantID: NodeID): DescendantNotDeletableError {
	return {
		kind: FileSystemErrorKind.DESCENDANT_NOT_DELETABLE,
		message: `Cannot delete: descendant ${descendantID} does not have delete permission`,
		descendantID
	};
}

export const FileSystemErrors = {
	nodeNotFound: createNodeNotFoundError,
	parentNotFound: createParentNotFoundError,
	parentNotFolder: createParentNotFolderError,
	targetNotFile: createTargetNotFileError,
	duplicateName: createDuplicateNameError,
	permissionDeniedWrite: createPermissionDeniedWriteError,
	permissionDeniedDelete: createPermissionDeniedDeleteError,
	permissionDeniedRename: createPermissionDeniedRenameError,
	cannotMoveRoot: createCannotMoveRootError,
	cycleDetected: createCycleDetectedError,
	moveIntoSubtree: createMoveIntoSubtreeError,
	descendantNotDeletable: createDescendantNotDeletableError
};
