import type {
	ContentHash,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';

export const ErrorMessages = {
	NODE_NOT_FOUND: (nodeID: NodeID): string => `Node with ID ${nodeID} not found`,
	PARENT_NOT_FOUND: (parentID: NodeID): string => `Parent node with ID ${parentID} not found`,
	PARENT_NOT_FOLDER: (parentID: NodeID): string =>
		`Parent node with ID ${parentID} is not a folder`,
	NAME_EXISTS: (name: string): string => `A node with name "${name}" already exists in this folder`,
	INVALID_NAME: (name: string): string => `Invalid node name: "${name}"`,
	NOT_A_FILE: (nodeID: NodeID): string => `Node with ID ${nodeID} is not a file`,
	CANNOT_DELETE_ROOT: (): string => 'Cannot delete the root folder',
	CANNOT_MOVE_ROOT: (): string => 'Cannot move the root folder',
	CANNOT_MOVE_TO_DESCENDANT: (): string => 'Cannot move a folder into its own descendant',
	CANNOT_MOVE_TO_SAME_PARENT: (): string => 'Node is already in this folder',
	PERMISSION_DENIED: (operation: string): string => `Permission denied: ${operation}`,
	EMPTY_NAME: (): string => 'Node name cannot be empty',
	HASH_MISMATCH: (expected: ContentHash, actual: ContentHash): string =>
		`Content hash mismatch: expected ${expected}, found ${actual}`
} as const;
