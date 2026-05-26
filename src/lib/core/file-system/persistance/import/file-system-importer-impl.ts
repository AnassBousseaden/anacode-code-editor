import JSZip from 'jszip';

import type {
	FileSystemMap,
	FileSystemMapReadonly,
	FileSystemNode,
	FileSystemPath,
	FolderNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import {
	DEFAULT_PERMISSIONS,
	EMPTY_CONTENT_HASH,
	isFolderNode,
	NodeType,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import {
	type IFileSystemZipImporter,
	type ImportedFileSystemState,
	type ZipImportError,
	ZipImportErrors,
	type ZipImportOptions
} from '$lib/core/file-system/persistance/import/file-system-import';
import { RandomNodeIDGenerator } from '$lib/core/file-system/loader/generators';
import { NodeFactory } from '$lib/core/file-system/event-factory/file-system-node-factory';

const SYNTHETIC_ROOT_NAME: string = 'root';
const EMPTY_PATH: FileSystemPath = '' as FileSystemPath;

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

function resolveAllPaths(map: FileSystemMap): void {
	const nodeIDStrings: string[] = Object.keys(map);

	for (const nodeIDString of nodeIDStrings) {
		const nodeID: NodeID = Number(nodeIDString) as NodeID;
		const resolvedPath: FileSystemPath = computePath(map, nodeID);
		(map[nodeID] as { path: FileSystemPath }).path = resolvedPath;
	}
}

interface BuildContext {
	readonly factory: NodeFactory;
	readonly nodeMap: FileSystemMap;
	readonly pathToNodeID: Map<string, NodeID>;
}

export class FileSystemZipImporter implements IFileSystemZipImporter {
	private readonly rootNodeID: NodeID;

	constructor(rootNodeID: NodeID = ROOT_NODE_ID) {
		this.rootNodeID = rootNodeID;
	}

	public async import(
		zipData: Blob,
		zipImportOptions?: ZipImportOptions
	): Promise<Result<ImportedFileSystemState, ZipImportError>> {
		const loadResult: Result<JSZip, ZipImportError> = await this.loadZip(zipData);
		if (!loadResult.ok) {
			return loadResult;
		}

		const zip: JSZip = loadResult.value;
		const entries: string[] = Object.keys(zip.files);

		if (entries.length === 0) {
			const buildContext: BuildContext = this.createBuildContext();
			resolveAllPaths(buildContext.nodeMap);
			return success({
				fileSystemMap: buildContext.nodeMap as FileSystemMapReadonly,
				rootNodeID: this.rootNodeID
			});
		}

		const promoteRoot: boolean = zipImportOptions?.promoteRoot === true;
		const sortedEntries: string[] = this.sortEntriesDirectoriesFirst(entries);
		return this.buildFileSystem(zip, sortedEntries, promoteRoot);
	}

	private async loadZip(zipData: Blob): Promise<Result<JSZip, ZipImportError>> {
		try {
			const buffer: ArrayBuffer = await zipData.arrayBuffer();
			const zip: JSZip = await JSZip.loadAsync(buffer);
			return success(zip);
		} catch {
			return failure(ZipImportErrors.INVALID_FORMAT);
		}
	}

	private sortEntriesDirectoriesFirst(entries: string[]): string[] {
		return entries.sort((a: string, b: string): number => {
			const aIsDir: boolean = a.endsWith('/');
			const bIsDir: boolean = b.endsWith('/');

			if (aIsDir !== bIsDir) {
				return aIsDir ? -1 : 1;
			}
			return a.localeCompare(b);
		});
	}

	private createBuildContext(): BuildContext {
		const idGenerator: RandomNodeIDGenerator = new RandomNodeIDGenerator();
		const factory: NodeFactory = new NodeFactory(idGenerator);
		const nodeMap: FileSystemMap = {};

		const syntheticRoot: FolderNode = {
			id: this.rootNodeID,
			parentID: null,
			name: SYNTHETIC_ROOT_NAME,
			path: EMPTY_PATH,
			type: NodeType.FOLDER,
			children: [],
			permissions: DEFAULT_PERMISSIONS,
			userSpace: null
		};
		nodeMap[this.rootNodeID] = syntheticRoot;

		return {
			factory: factory,
			nodeMap: nodeMap,
			pathToNodeID: new Map()
		};
	}

	private normalizePath(path: string): string {
		return path.endsWith('/') ? path.slice(0, -1) : path;
	}

	private splitPathSafe(path: string): string[] {
		return path.split('/').filter((p: string): boolean => p.length > 0 && p !== '.' && p !== '..');
	}

	private async buildFileSystem(
		zip: JSZip,
		sortedEntries: string[],
		promoteRoot: boolean
	): Promise<Result<ImportedFileSystemState, ZipImportError>> {
		const buildContext: BuildContext = this.createBuildContext();

		for (const entryPath of sortedEntries) {
			const zipEntry: JSZip.JSZipObject = zip.files[entryPath];
			const result: Result<void, ZipImportError> = zipEntry.dir
				? this.processDirectory(buildContext, entryPath)
				: await this.processFile(buildContext, zipEntry, entryPath);

			if (!result.ok) {
				return failure(result.error);
			}
		}

		if (promoteRoot) {
			this.promoteRootIfApplicable(buildContext);
		}

		resolveAllPaths(buildContext.nodeMap);

		return success({
			fileSystemMap: buildContext.nodeMap as FileSystemMapReadonly,
			rootNodeID: this.rootNodeID
		});
	}

	private processDirectory(ctx: BuildContext, entryPath: string): Result<void, ZipImportError> {
		const result: Result<NodeID, ZipImportError> = this.ensureFolderExists(ctx, entryPath);
		return result.ok ? success(undefined) : failure(result.error);
	}

	private async processFile(
		ctx: BuildContext,
		zipEntry: JSZip.JSZipObject,
		entryPath: string
	): Promise<Result<void, ZipImportError>> {
		const normalizedPath: string = this.normalizePath(entryPath);
		const pathParts: string[] = this.splitPathSafe(normalizedPath);

		if (pathParts.length === 0) {
			return success(undefined);
		}

		const existingNode: FileSystemNode | undefined = this.getNodeAtPath(ctx, normalizedPath);

		if (existingNode !== undefined && isFolderNode(existingNode)) {
			return failure(ZipImportErrors.STRUCTURE_INVALID);
		}

		const contentResult: Result<string, ZipImportError> = await this.readEntryContent(zipEntry);
		if (!contentResult.ok) {
			return failure(contentResult.error);
		}

		if (existingNode !== undefined) {
			return this.updateFileContent(ctx, existingNode.id, contentResult.value);
		}

		return this.createFileNode(ctx, pathParts, contentResult.value);
	}

	private getNodeAtPath(ctx: BuildContext, normalizedPath: string): FileSystemNode | undefined {
		const nodeID: NodeID | undefined = ctx.pathToNodeID.get(normalizedPath);
		return nodeID !== undefined ? ctx.nodeMap[nodeID] : undefined;
	}

	private updateFileContent(
		ctx: BuildContext,
		fileID: NodeID,
		content: string
	): Result<void, ZipImportError> {
		const existingNode: FileSystemNode = ctx.nodeMap[fileID];
		ctx.nodeMap[fileID] = { ...existingNode, content } as FileSystemNode;
		return success(undefined);
	}

	private createFileNode(
		ctx: BuildContext,
		pathParts: string[],
		content: string
	): Result<void, ZipImportError> {
		const fileName: string = pathParts[pathParts.length - 1];
		const parentResult: Result<NodeID, ZipImportError> = this.resolveParentID(ctx, pathParts);

		if (!parentResult.ok) {
			return failure(parentResult.error);
		}

		const fileSpec = ctx.factory.createFileNode(parentResult.value, fileName, content);

		const fileNode: FileSystemNode = {
			id: fileSpec.id,
			parentID: fileSpec.parentID,
			name: fileSpec.name,
			path: EMPTY_PATH,
			type: NodeType.FILE,
			content: fileSpec.content,
			contentHash: EMPTY_CONTENT_HASH,
			permissions: fileSpec.permissions,
			userSpace: fileSpec.userSpace
		};

		ctx.nodeMap[fileNode.id] = fileNode;
		ctx.pathToNodeID.set(pathParts.join('/'), fileNode.id);

		this.addChildToParent(ctx, parentResult.value, fileNode.id);

		return success(undefined);
	}

	private resolveParentID(ctx: BuildContext, pathParts: string[]): Result<NodeID, ZipImportError> {
		if (pathParts.length <= 1) {
			return success(this.rootNodeID);
		}

		const parentPath: string = pathParts.slice(0, -1).join('/');
		return this.ensureFolderExists(ctx, parentPath);
	}

	private ensureFolderExists(
		ctx: BuildContext,
		folderPath: string
	): Result<NodeID, ZipImportError> {
		const normalizedPath: string = this.normalizePath(folderPath);
		const existingID: NodeID | undefined = ctx.pathToNodeID.get(normalizedPath);

		if (existingID !== undefined) {
			const existingNode: FileSystemNode = ctx.nodeMap[existingID];
			return isFolderNode(existingNode)
				? success(existingID)
				: failure(ZipImportErrors.STRUCTURE_INVALID);
		}

		const pathParts: string[] = this.splitPathSafe(normalizedPath);

		if (pathParts.length === 0) {
			return success(this.rootNodeID);
		}

		const parentResult: Result<NodeID, ZipImportError> = this.resolveParentID(ctx, pathParts);
		if (!parentResult.ok) {
			return parentResult;
		}

		const folderName: string = pathParts[pathParts.length - 1];
		const folderSpec = ctx.factory.createFolderNode(parentResult.value, folderName);

		const folderNode: FolderNode = {
			id: folderSpec.id,
			parentID: folderSpec.parentID,
			name: folderSpec.name,
			path: EMPTY_PATH,
			type: NodeType.FOLDER,
			children: [],
			permissions: folderSpec.permissions,
			userSpace: folderSpec.userSpace
		};

		ctx.nodeMap[folderNode.id] = folderNode;
		ctx.pathToNodeID.set(normalizedPath, folderNode.id);

		this.addChildToParent(ctx, parentResult.value, folderNode.id);

		return success(folderNode.id);
	}

	private addChildToParent(ctx: BuildContext, parentID: NodeID, childID: NodeID): void {
		const parentNode: FolderNode = ctx.nodeMap[parentID] as FolderNode;
		const updatedParent: FolderNode = {
			...parentNode,
			children: [...parentNode.children, childID]
		};
		ctx.nodeMap[parentID] = updatedParent;
	}

	private promoteRootIfApplicable(buildContext: BuildContext): void {
		const syntheticRoot: FolderNode = buildContext.nodeMap[this.rootNodeID] as FolderNode;
		const children: readonly NodeID[] = syntheticRoot.children;

		if (children.length !== 1) {
			return;
		}

		const onlyChild: FileSystemNode = buildContext.nodeMap[children[0]];

		if (!isFolderNode(onlyChild)) {
			return;
		}

		for (const grandchildID of onlyChild.children) {
			const grandchild: FileSystemNode = buildContext.nodeMap[grandchildID];
			buildContext.nodeMap[grandchildID] = { ...grandchild, parentID: this.rootNodeID };
		}

		const promotedRoot: FolderNode = {
			id: this.rootNodeID,
			parentID: null,
			name: onlyChild.name,
			path: EMPTY_PATH,
			type: NodeType.FOLDER,
			children: onlyChild.children,
			permissions: onlyChild.permissions,
			userSpace: null
		};
		buildContext.nodeMap[this.rootNodeID] = promotedRoot;

		delete buildContext.nodeMap[onlyChild.id];
	}

	private async readEntryContent(
		zipEntry: JSZip.JSZipObject
	): Promise<Result<string, ZipImportError>> {
		try {
			const content: string = await zipEntry.async('string');
			return success(content);
		} catch {
			return failure(ZipImportErrors.READ_FAILED);
		}
	}
}
