import {
	CommandType,
	type ContentHash,
	type CreateFileCommand,
	type CreateFolderCommand,
	type DeleteNodeCommand,
	type FileSystemWriteOrigin,
	type MoveNodeCommand,
	type NodeID,
	type RenameNodeCommand,
	type UpdateContentCommand,
	type UpdateContentIfCommand,
	type UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemCommandFactory } from '$lib/core/file-system/services/command-factory/file-system-command-factory';
import type { IEditorUserSpaceStateService } from '../../../state/user-space/editor-user-space-state';

export class FileSystemCommandFactory implements IFileSystemCommandFactory {
	private readonly userSpaceStateService: IEditorUserSpaceStateService;

	constructor(userSpaceStateService: IEditorUserSpaceStateService) {
		this.userSpaceStateService = userSpaceStateService;
	}

	public createCreateFileCommand(parentID: NodeID, name: string): CreateFileCommand {
		const currentUserSpace: UserSpaceTag | null = this.userSpaceStateService.getActiveUserSpace();
		const command: CreateFileCommand = {
			type: CommandType.CREATE_FILE,
			parentID: parentID,
			name: name,
			userSpace: currentUserSpace
		};
		return command;
	}

	public createCreateFolderCommand(parentID: NodeID, name: string): CreateFolderCommand {
		const currentUserSpace: UserSpaceTag | null = this.userSpaceStateService.getActiveUserSpace();
		const command: CreateFolderCommand = {
			type: CommandType.CREATE_FOLDER,
			parentID: parentID,
			name: name,
			userSpace: currentUserSpace
		};
		return command;
	}

	public createDeleteNodeCommand(nodeID: NodeID): DeleteNodeCommand {
		const command: DeleteNodeCommand = {
			type: CommandType.DELETE_NODE,
			nodeID: nodeID
		};
		return command;
	}

	public createRenameNodeCommand(nodeID: NodeID, newName: string): RenameNodeCommand {
		const command: RenameNodeCommand = {
			type: CommandType.RENAME_NODE,
			nodeID: nodeID,
			newName: newName
		};
		return command;
	}

	public createMoveNodeCommand(nodeID: NodeID, newParentID: NodeID): MoveNodeCommand {
		const command: MoveNodeCommand = {
			type: CommandType.MOVE_NODE,
			nodeID: nodeID,
			newParentID: newParentID
		};
		return command;
	}

	public createUpdateContentCommand(
		nodeID: NodeID,
		newContent: string,
		origin: FileSystemWriteOrigin
	): UpdateContentCommand {
		const command: UpdateContentCommand = {
			type: CommandType.UPDATE_CONTENT,
			nodeID: nodeID,
			newContent: newContent,
			origin: origin
		};
		return command;
	}

	public createUpdateContentIfCommand(
		nodeID: NodeID,
		newContent: string,
		origin: FileSystemWriteOrigin,
		targetHash: ContentHash
	): UpdateContentIfCommand {
		const command: UpdateContentIfCommand = {
			type: CommandType.UPDATE_CONTENT_IF,
			nodeID: nodeID,
			newContent: newContent,
			origin: origin,
			targetHash: targetHash
		};
		return command;
	}
}
