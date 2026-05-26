import type {
	FileNode,
	FileSystemMap,
	FileSystemMapReadonly,
	FileSystemNode,
	FileSystemNodeSpec,
	FileSystemPath,
	FolderNode,
	NodeID,
	NodePermissions,
	UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import {
	DEFAULT_PERMISSIONS,
	EMPTY_CONTENT_HASH,
	isFileNodeSpec,
	NodeType,
	ROOT_NODE_ID,
	ROOT_PERMISSIONS
} from '$lib/core/file-system/domain/file-system-models';
import type { ImportedFileSystemState } from '$lib/core/file-system/persistance/import/file-system-import';
import { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';
import { RandomNodeIDGenerator } from '$lib/core/file-system/loader/generators';

function computePath(map: FileSystemMap, nodeID: NodeID): FileSystemPath {
	const segments: string[] = [];
	let currentID: NodeID | null = nodeID;

	while (currentID !== null) {
		const node: FileSystemNode | undefined = map[currentID];

		if (node === undefined) {
			break;
		}

		segments.unshift(node.name);
		currentID = node.parentID;
	}

	return ('/' + segments.join('/')) as FileSystemPath;
}

export class FileSystemMapBuilder {
	private readonly nodeFactory: NodeFactory;
	private readonly nodeSpecs: FileSystemNodeSpec[];
	private readonly rootName: string;
	private readonly rootPermissions: NodePermissions;

	constructor(rootName: string = 'root', rootPermissions: NodePermissions = ROOT_PERMISSIONS) {
		this.nodeFactory = new NodeFactory(new RandomNodeIDGenerator());
		this.nodeSpecs = [];
		this.rootName = rootName;
		this.rootPermissions = rootPermissions;
	}

	addFile(
		parentID: NodeID,
		name: string,
		content: string,
		permissions: NodePermissions = DEFAULT_PERMISSIONS,
		userSpace: UserSpaceTag | null = null
	): NodeID {
		const fileSpec = this.nodeFactory.createFileNode(
			parentID,
			name,
			content,
			permissions,
			userSpace
		);
		this.nodeSpecs.push(fileSpec);
		return fileSpec.id;
	}

	addFolder(
		parentID: NodeID,
		name: string,
		permissions: NodePermissions = DEFAULT_PERMISSIONS,
		userSpace: UserSpaceTag | null = null
	): NodeID {
		const folderSpec = this.nodeFactory.createFolderNode(parentID, name, permissions, userSpace);
		this.nodeSpecs.push(folderSpec);
		return folderSpec.id;
	}

	mergeImported(
		importedState: ImportedFileSystemState,
		targetParentID: NodeID = ROOT_NODE_ID,
		permissions: NodePermissions = DEFAULT_PERMISSIONS,
		userSpace: UserSpaceTag | null = null
	): void {
		const importedMap: FileSystemMapReadonly = importedState.fileSystemMap;
		const importedRootID: NodeID = importedState.rootNodeID;
		const nodeIDStrings: string[] = Object.keys(importedMap);

		for (const nodeIDString of nodeIDStrings) {
			const nodeID: NodeID = Number(nodeIDString) as NodeID;

			if (nodeID === importedRootID) {
				continue;
			}

			const node: FileSystemNode = importedMap[nodeID];
			const isDirectChildOfImportedRoot: boolean = node.parentID === importedRootID;

			const reparentedNode: FileSystemNode = isDirectChildOfImportedRoot
				? { ...node, parentID: targetParentID, permissions: permissions, userSpace: userSpace }
				: { ...node, permissions: permissions, userSpace: userSpace };

			if (isFileNodeSpec(reparentedNode)) {
				this.nodeSpecs.push({
					id: reparentedNode.id,
					parentID: reparentedNode.parentID,
					name: reparentedNode.name,
					type: NodeType.FILE,
					content: reparentedNode.content,
					permissions: reparentedNode.permissions,
					userSpace: reparentedNode.userSpace
				});
			} else {
				this.nodeSpecs.push({
					id: reparentedNode.id,
					parentID: reparentedNode.parentID,
					name: reparentedNode.name,
					type: NodeType.FOLDER,
					permissions: reparentedNode.permissions,
					userSpace: reparentedNode.userSpace
				});
			}
		}
	}

	build(): FileSystemMapReadonly {
		const fileSystemMap: FileSystemMap = {};
		const childrenByParent: Map<NodeID, NodeID[]> = new Map<NodeID, NodeID[]>();

		for (const spec of this.nodeSpecs) {
			const parentID: NodeID | null = spec.parentID;

			if (parentID !== null) {
				const existingChildren: NodeID[] | undefined = childrenByParent.get(parentID);

				if (existingChildren === undefined) {
					childrenByParent.set(parentID, [spec.id]);
				} else {
					existingChildren.push(spec.id);
				}
			}
		}

		const rootChildren: NodeID[] = childrenByParent.get(ROOT_NODE_ID) ?? [];

		const rootNode: FolderNode = {
			id: ROOT_NODE_ID,
			parentID: null,
			name: this.rootName,
			path: ('/' + this.rootName) as FileSystemPath,
			type: NodeType.FOLDER,
			children: rootChildren,
			permissions: this.rootPermissions,
			userSpace: null
		};

		fileSystemMap[ROOT_NODE_ID] = rootNode;

		for (const spec of this.nodeSpecs) {
			if (isFileNodeSpec(spec)) {
				const fileNode: FileNode = {
					id: spec.id,
					parentID: spec.parentID,
					name: spec.name,
					path: '' as FileSystemPath,
					type: NodeType.FILE,
					content: spec.content,
					contentHash: EMPTY_CONTENT_HASH,
					permissions: spec.permissions,
					userSpace: spec.userSpace
				};
				fileSystemMap[spec.id] = fileNode;
			} else {
				const computedChildren: NodeID[] = childrenByParent.get(spec.id) ?? [];
				const folderNode: FolderNode = {
					id: spec.id,
					parentID: spec.parentID,
					name: spec.name,
					path: '' as FileSystemPath,
					type: NodeType.FOLDER,
					children: computedChildren,
					permissions: spec.permissions,
					userSpace: spec.userSpace
				};
				fileSystemMap[spec.id] = folderNode;
			}
		}

		for (const spec of this.nodeSpecs) {
			const node: FileSystemNode | undefined = fileSystemMap[spec.id];

			if (node === undefined) {
				continue;
			}

			const resolvedPath: FileSystemPath = computePath(fileSystemMap, spec.id);
			(fileSystemMap[spec.id] as { path: FileSystemPath }).path = resolvedPath;
		}

		return fileSystemMap as FileSystemMapReadonly;
	}
}
