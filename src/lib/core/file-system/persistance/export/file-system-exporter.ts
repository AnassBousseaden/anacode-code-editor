import {
	type FileSystemMapReadonly,
	type FileSystemNode,
	type NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure, Result } from '$lib/core/shared/models-utils';

export enum ZipExportErrorKind {
	NODE_NOT_FOUND = 'NODE_NOT_FOUND',
	EMPTY_SELECTION = 'EMPTY_SELECTION',
	COMPRESSION_FAILED = 'COMPRESSION_FAILED',
	FORMATTING_FAILED = 'FORMATTING_FAILED'
}

export type ZipExportError = OperationFailure<ZipExportErrorKind>;

export const ZipExportErrors: Readonly<Record<ZipExportErrorKind, ZipExportError>> = {
	[ZipExportErrorKind.NODE_NOT_FOUND]: {
		kind: ZipExportErrorKind.NODE_NOT_FOUND,
		message: 'A referenced node was not found in the file system'
	},
	[ZipExportErrorKind.EMPTY_SELECTION]: {
		kind: ZipExportErrorKind.EMPTY_SELECTION,
		message: 'No files or folders match the export criteria'
	},
	[ZipExportErrorKind.COMPRESSION_FAILED]: {
		kind: ZipExportErrorKind.COMPRESSION_FAILED,
		message: 'Failed to create or compress the zip archive'
	},
	[ZipExportErrorKind.FORMATTING_FAILED]: {
		kind: ZipExportErrorKind.FORMATTING_FAILED,
		message: 'Failed to format file content'
	}
};

export type ExportFilter = (node: FileSystemNode) => boolean;

export interface ZipExportOptions {
	readonly rootNodeID: NodeID;
	readonly filter?: ExportFilter;
	readonly excludeRootFolder?: boolean;
}

export interface IZipOutputStrategy<T> {
	process(data: Blob): Promise<T>;
}

export interface IFileSystemZipExporter {
	export(
		state: FileSystemMapReadonly,
		options: ZipExportOptions
	): Promise<Result<Blob, ZipExportError>>;
}
