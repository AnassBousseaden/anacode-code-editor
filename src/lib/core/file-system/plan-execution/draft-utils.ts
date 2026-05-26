import type { Draft } from 'immer';

import type {
	ContentHash,
	FileNode,
	FileSystemNode,
	FileSystemPath,
	FolderNode,
	NodeID,
	NodePermissions,
	UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import { NodeType } from '$lib/core/file-system/domain/file-system-models';

export function snapshotNode(draftNode: Draft<FileSystemNode>): FileSystemNode {
	const id: NodeID = draftNode.id;
	const parentID: NodeID | null = draftNode.parentID;
	const name: string = draftNode.name;
	const path: FileSystemPath = draftNode.path;
	const permissions: NodePermissions = {
		read: draftNode.permissions.read,
		write: draftNode.permissions.write,
		delete: draftNode.permissions.delete,
		rename: draftNode.permissions.rename
	};
	const userSpace: UserSpaceTag | null = draftNode.userSpace;

	if (draftNode.type === NodeType.FILE) {
		const contentHash: ContentHash = draftNode.contentHash;
		const fileNode: FileNode = {
			id: id,
			parentID: parentID,
			name: name,
			path: path,
			type: NodeType.FILE,
			content: draftNode.content,
			contentHash: contentHash,
			permissions: permissions,
			userSpace: userSpace
		};
		return fileNode;
	}

	const children: NodeID[] = [];
	const draftChildren: ReadonlyArray<NodeID> = draftNode.children;

	for (const childID of draftChildren) {
		children.push(childID);
	}

	const folderNode: FolderNode = {
		id: id,
		parentID: parentID,
		name: name,
		path: path,
		type: NodeType.FOLDER,
		children: children,
		permissions: permissions,
		userSpace: userSpace
	};

	return folderNode;
}
