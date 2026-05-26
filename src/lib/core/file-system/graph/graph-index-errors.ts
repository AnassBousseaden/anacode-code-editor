import type { FileSystemEventType, NodeID } from '$lib/core/file-system/domain/file-system-models';

/**
 * Error messages for graph index operations.
 * Centralized registry for consistent error reporting.
 */
export const GraphIndexErrorMessages = {
	NODE_NOT_IN_GRAPH: (nodeID: NodeID): string => `Node with ID ${nodeID} does not exist in graph`,
	PARENT_NOT_IN_GRAPH: (parentID: NodeID): string =>
		`Parent node with ID ${parentID} does not exist in graph`,
	MOVE_TO_SELF: (nodeID: NodeID): string => `Cannot move node ${nodeID} to itself`,
	MOVE_TO_DESCENDANT: (nodeID: NodeID, descendantID: NodeID): string =>
		`Cannot move node ${nodeID} into its descendant ${descendantID}`,
	UNKNOWN_EVENT_TYPE: (eventType: FileSystemEventType): string =>
		`Unknown event type encountered: ${eventType}`,
	MISSING_ROOT: (): string => 'Initial state must contain a root node',
	MISSING_PARENT_ON_HYDRATE: (nodeID: NodeID, parentID: NodeID): string =>
		`Node ${nodeID} references non-existent parent ${parentID} during hydration`,
	CYCLE_DETECTED: (): string => 'Cycle detected in file system structure - state is corrupted',
	DISCONNECTED_NODES: (count: number): string =>
		`File system contains ${count} orphan node(s) not reachable from root`,
	MULTIPLE_PARENTS: (nodeID: NodeID, parentCount: number): string =>
		`Node ${nodeID} has ${parentCount} parents — corrupted graph`,
	NODE_NOT_REACHABLE_FROM_ROOT: (nodeID: NodeID): string =>
		`Node ${nodeID} is not reachable from root — disconnected from tree`,
	APPLY_FAILED: (message: string): string => `Graph apply failed: ${message}`
} as const;
