import {
	type AtomicEventPayload,
	type FileNode,
	type FileSystemEvent,
	FileSystemEventType,
	type FileSystemNode,
	type FileSystemPath,
	type FileSystemPlan,
	type FileSystemWriteOrigin,
	type NodeCreatedEvent,
	type NodeDeletedEvent,
	type NodeID,
	type NodeMovedEvent,
	type NodePathChangedEvent,
	type NodeRenamedEvent,
	type NodeUpdatedEvent
} from '$lib/core/file-system/domain/file-system-models';
import type {
	IEventIDGenerator,
	ITimestampProvider
} from '$lib/core/file-system/domain/file-system-computation-models';

export class FileSystemEventFactory {
	constructor(
		private readonly eventIDGenerator: IEventIDGenerator,
		private readonly timestampProvider: ITimestampProvider
	) {}

	createNodeCreatedEvent(node: FileSystemNode): NodeCreatedEvent {
		return {
			type: FileSystemEventType.NODE_CREATED,
			nodeID: node.id,
			timestamp: this.timestampProvider.now(),
			node: node
		};
	}

	createNodeUpdatedEvent(
		before: FileNode,
		after: FileNode,
		origin: FileSystemWriteOrigin
	): NodeUpdatedEvent {
		return {
			type: FileSystemEventType.NODE_CONTENT_UPDATED,
			nodeID: before.id,
			timestamp: this.timestampProvider.now(),
			before: before,
			after: after,
			origin: origin
		};
	}

	createNodeDeletedEvent(node: FileSystemNode): NodeDeletedEvent {
		return {
			type: FileSystemEventType.NODE_DELETED,
			nodeID: node.id,
			timestamp: this.timestampProvider.now(),
			node: node
		};
	}

	createNodeRenamedEvent(
		before: FileSystemNode,
		after: FileSystemNode,
		oldName: string,
		newName: string
	): NodeRenamedEvent {
		return {
			type: FileSystemEventType.NODE_RENAMED,
			nodeID: before.id,
			timestamp: this.timestampProvider.now(),
			before: before,
			after: after,
			oldName: oldName,
			newName: newName
		};
	}

	createNodeMovedEvent(
		before: FileSystemNode,
		after: FileSystemNode,
		oldParentID: NodeID,
		newParentID: NodeID
	): NodeMovedEvent {
		return {
			type: FileSystemEventType.NODE_MOVED,
			nodeID: before.id,
			timestamp: this.timestampProvider.now(),
			before: before,
			after: after,
			oldParentID: oldParentID,
			newParentID: newParentID
		};
	}

	createNodePathChangedEvent(
		before: FileSystemNode,
		after: FileSystemNode,
		oldPath: FileSystemPath,
		newPath: FileSystemPath
	): NodePathChangedEvent {
		return {
			type: FileSystemEventType.NODE_PATH_CHANGED,
			nodeID: before.id,
			timestamp: this.timestampProvider.now(),
			before: before,
			after: after,
			oldPath: oldPath,
			newPath: newPath
		};
	}

	createEvent(plan: FileSystemPlan, changes: ReadonlyArray<AtomicEventPayload>): FileSystemEvent {
		return {
			id: this.eventIDGenerator.generate(),
			timestamp: this.timestampProvider.now(),
			description: plan.description,
			plan: plan,
			changes: changes
		};
	}
}
