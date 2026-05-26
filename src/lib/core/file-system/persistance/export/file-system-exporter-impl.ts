import JSZip from 'jszip';

import type {
	FileSystemMapReadonly,
	FileSystemNode,
	FolderNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import {
	isFileNode,
	isFolderNode,
	ROOT_NODE_ID
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import {
	type ExportFilter,
	type IFileSystemZipExporter,
	type ZipExportError,
	ZipExportErrors,
	type ZipExportOptions
} from '$lib/core/file-system/persistance/export/file-system-exporter';

export class FileSystemZipExporter implements IFileSystemZipExporter {
	private readonly rootNodeID: NodeID;

	constructor(rootNodeID: NodeID = ROOT_NODE_ID) {
		this.rootNodeID = rootNodeID;
	}

	public async export(
		state: FileSystemMapReadonly,
		options: ZipExportOptions
	): Promise<Result<Blob, ZipExportError>> {
		const effectiveRootNodeID: NodeID = options.rootNodeID ?? this.rootNodeID;
		const rootNode: FileSystemNode | undefined = state[effectiveRootNodeID];

		if (rootNode === undefined) {
			return failure(ZipExportErrors.NODE_NOT_FOUND);
		}

		const filter: ExportFilter = options.filter ?? ((_node: FileSystemNode): boolean => true);
		const excludeRootFolder: boolean = options.excludeRootFolder === true;

		if (!excludeRootFolder && !filter(rootNode)) {
			return failure(ZipExportErrors.EMPTY_SELECTION);
		}

		const zip: JSZip = new JSZip();

		if (isFileNode(rootNode)) {
			zip.file(rootNode.name, rootNode.content);
		} else if (isFolderNode(rootNode)) {
			if (excludeRootFolder) {
				const addResult: ZipExportError | null = this.addFolderContents(
					state,
					rootNode,
					zip,
					filter
				);

				if (addResult !== null) {
					return failure(addResult);
				}
			} else {
				const rootFolder: JSZip | null = zip.folder(rootNode.name);

				if (rootFolder === null) {
					return failure(ZipExportErrors.COMPRESSION_FAILED);
				}

				const addResult: ZipExportError | null = this.addFolderContents(
					state,
					rootNode,
					rootFolder,
					filter
				);

				if (addResult !== null) {
					return failure(addResult);
				}
			}
		} else {
			return failure(ZipExportErrors.NODE_NOT_FOUND);
		}

		try {
			const blob: Blob = await zip.generateAsync({ type: 'blob' });
			return success(blob);
		} catch {
			return failure(ZipExportErrors.COMPRESSION_FAILED);
		}
	}

	private addFolderContents(
		state: FileSystemMapReadonly,
		folder: FolderNode,
		zipFolder: JSZip,
		filter: ExportFilter
	): ZipExportError | null {
		for (const childID of folder.children) {
			const childNode: FileSystemNode | undefined = state[childID];

			if (childNode === undefined) {
				return ZipExportErrors.NODE_NOT_FOUND;
			}

			if (!filter(childNode)) {
				continue;
			}

			if (isFileNode(childNode)) {
				zipFolder.file(childNode.name, childNode.content);
			} else if (isFolderNode(childNode)) {
				const childZipFolder: JSZip | null = zipFolder.folder(childNode.name);

				if (childZipFolder === null) {
					return ZipExportErrors.COMPRESSION_FAILED;
				}

				const childResult: ZipExportError | null = this.addFolderContents(
					state,
					childNode,
					childZipFolder,
					filter
				);

				if (childResult !== null) {
					return childResult;
				}
			} else {
				return ZipExportErrors.NODE_NOT_FOUND;
			}
		}

		return null;
	}
}
