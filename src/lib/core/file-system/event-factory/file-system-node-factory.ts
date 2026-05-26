import {
	DEFAULT_PERMISSIONS,
	type FileNodeSpec,
	type FolderNodeSpec,
	type NodeID,
	type NodePermissions,
	NodeType,
	type UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import type { INodeIDGenerator } from '$lib/core/file-system/domain/file-system-computation-models';

export class NodeFactory {
	constructor(private readonly idGenerator: INodeIDGenerator) {}

	createFileNode(
		parentID: NodeID,
		name: string,
		content: string = '',
		permissions: NodePermissions = DEFAULT_PERMISSIONS,
		userSpace: UserSpaceTag | null = null
	): FileNodeSpec {
		return {
			id: this.idGenerator.generate(),
			parentID: parentID,
			name: name,
			type: NodeType.FILE,
			content: content,
			permissions: permissions,
			userSpace: userSpace
		};
	}

	createFolderNode(
		parentID: NodeID | null,
		name: string,
		permissions: NodePermissions = DEFAULT_PERMISSIONS,
		userSpace: UserSpaceTag | null = null
	): FolderNodeSpec {
		return {
			id: this.idGenerator.generate(),
			parentID: parentID,
			name: name,
			type: NodeType.FOLDER,
			permissions: permissions,
			userSpace: userSpace
		};
	}
}
