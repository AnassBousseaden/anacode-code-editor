import {
	type FileSystemNode,
	type FolderNode,
	isFolderNode,
	type NodeID,
	NodeType
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';

import type { ITreeGraph } from '$lib/core/file-tree-v2/tree-engine/sorted-tree-graph';

export class SortedTreeGraph implements ITreeGraph<FileSystemNode, NodeID> {
	private readonly fileSystemService: IFileSystemService;
	private readonly rootNodeID: NodeID;

	constructor(fileSystemService: IFileSystemService, rootNodeID: NodeID) {
		this.fileSystemService = fileSystemService;
		this.rootNodeID = rootNodeID;
	}

	public getRoot(): NodeID {
		return this.rootNodeID;
	}

	public getChildren(nodeID: NodeID): ReadonlyArray<NodeID> {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);

		if (node === null || !isFolderNode(node)) {
			return [];
		}

		const folder: FolderNode = node as FolderNode;
		const children: FileSystemNode[] = [];

		for (const childID of folder.children) {
			const childNode: FileSystemNode | null = this.fileSystemService.getNode(childID);
			if (childNode !== null) {
				children.push(childNode);
			}
		}

		children.sort(compareNodesByTypeAndName);

		const childNodeIDs: NodeID[] = children.map((child: FileSystemNode): NodeID => child.id);
		return childNodeIDs;
	}

	public getParent(nodeID: NodeID): NodeID | null {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);

		if (node === null) {
			return null;
		}

		return node.parentID;
	}

	public getNode(nodeID: NodeID): FileSystemNode | null {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		return node;
	}
}

function compareNodesByTypeAndName(firstNode: FileSystemNode, secondNode: FileSystemNode): number {
	const firstIsFolder: boolean = firstNode.type === NodeType.FOLDER;
	const secondIsFolder: boolean = secondNode.type === NodeType.FOLDER;

	if (firstIsFolder && !secondIsFolder) {
		return -1;
	}

	if (!firstIsFolder && secondIsFolder) {
		return 1;
	}

	const result: number = firstNode.name.localeCompare(secondNode.name);
	return result;
}
