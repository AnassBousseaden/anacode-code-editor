import {
	type ContentHash,
	type CreateFileCommand,
	type CreateFolderCommand,
	type DeleteNodeCommand,
	type FileSystemWriteOrigin,
	type MoveNodeCommand,
	type NodeID,
	type RenameNodeCommand,
	type UpdateContentCommand,
	type UpdateContentIfCommand
} from '$lib/core/file-system/domain/file-system-models';

export interface IFileSystemCommandFactory {
	createCreateFileCommand(parentID: NodeID, name: string): CreateFileCommand;

	createCreateFolderCommand(parentID: NodeID, name: string): CreateFolderCommand;

	createDeleteNodeCommand(nodeID: NodeID): DeleteNodeCommand;

	createRenameNodeCommand(nodeID: NodeID, newName: string): RenameNodeCommand;

	createMoveNodeCommand(nodeID: NodeID, newParentID: NodeID): MoveNodeCommand;

	createUpdateContentCommand(
		nodeID: NodeID,
		newContent: string,
		origin: FileSystemWriteOrigin
	): UpdateContentCommand;

	createUpdateContentIfCommand(
		nodeID: NodeID,
		newContent: string,
		origin: FileSystemWriteOrigin,
		targetHash: ContentHash
	): UpdateContentIfCommand;
}
