import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';

import type { FolderNode } from '$lib/core/file-system/domain/file-system-models';
import { ROOT_NODE_ID } from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import {
	type ImportedFileSystemState,
	type ZipImportError,
	ZipImportErrorKind
} from '$lib/core/file-system/persistance/import/file-system-import';
import { FileSystemZipImporter } from '$lib/core/file-system/persistance/import/file-system-importer-impl';

async function createEmptyZipBlob(): Promise<Blob> {
	const zip: JSZip = new JSZip();
	const buffer: Uint8Array = await zip.generateAsync({ type: 'uint8array' });
	const arrayBuffer: ArrayBuffer = buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength
	) as ArrayBuffer;
	return new Blob([arrayBuffer], { type: 'application/zip' });
}

async function createZipWithFile(fileName: string, fileContent: string): Promise<Blob> {
	const zip: JSZip = new JSZip();
	zip.file(fileName, fileContent);
	const buffer: Uint8Array = await zip.generateAsync({ type: 'uint8array' });
	const arrayBuffer: ArrayBuffer = buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength
	) as ArrayBuffer;
	return new Blob([arrayBuffer], { type: 'application/zip' });
}

describe('FileSystemZipImporter', (): void => {
	describe('empty zip archive', (): void => {
		it('should return success with only the synthetic root node', async (): Promise<void> => {
			const importer: FileSystemZipImporter = new FileSystemZipImporter();
			const blob: Blob = await createEmptyZipBlob();

			const result: Result<ImportedFileSystemState, ZipImportError> = await importer.import(blob);

			expect(result.ok).toBe(true);

			if (!result.ok) {
				return;
			}

			expect(result.value.rootNodeID).toBe(ROOT_NODE_ID);

			const nodeKeys: string[] = Object.keys(result.value.fileSystemMap);
			expect(nodeKeys.length).toBe(1);
			expect(result.value.fileSystemMap[ROOT_NODE_ID]).toBeDefined();
		});

		it('should return a root node with no children', async (): Promise<void> => {
			const importer: FileSystemZipImporter = new FileSystemZipImporter();
			const blob: Blob = await createEmptyZipBlob();

			const result: Result<ImportedFileSystemState, ZipImportError> = await importer.import(blob);

			expect(result.ok).toBe(true);

			if (!result.ok) {
				return;
			}

			const rootNode: FolderNode = result.value.fileSystemMap[ROOT_NODE_ID] as FolderNode;
			expect(rootNode).toBeDefined();
			expect(rootNode.children.length).toBe(0);
		});
	});

	describe('non-empty zip archive', (): void => {
		it('should return success with the file node under root', async (): Promise<void> => {
			const importer: FileSystemZipImporter = new FileSystemZipImporter();
			const blob: Blob = await createZipWithFile('hello.txt', 'world');

			const result: Result<ImportedFileSystemState, ZipImportError> = await importer.import(blob);

			expect(result.ok).toBe(true);

			if (!result.ok) {
				return;
			}

			const nodeKeys: string[] = Object.keys(result.value.fileSystemMap);
			expect(nodeKeys.length).toBe(2);
		});
	});

	describe('invalid zip data', (): void => {
		it('should return failure for corrupt data', async (): Promise<void> => {
			const importer: FileSystemZipImporter = new FileSystemZipImporter();
			const blob: Blob = new Blob(['not a zip']);

			const result: Result<ImportedFileSystemState, ZipImportError> = await importer.import(blob);

			expect(result.ok).toBe(false);

			if (result.ok) {
				return;
			}

			expect(result.error.kind).toBe(ZipImportErrorKind.INVALID_FORMAT);
		});
	});
});
