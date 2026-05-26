import type {
	FileSystemMapReadonly,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure, Result } from '$lib/core/shared/models-utils';

export enum ZipImportErrorKind {
	INVALID_FORMAT = 'INVALID_FORMAT',
	READ_FAILED = 'READ_FAILED',
	STRUCTURE_INVALID = 'STRUCTURE_INVALID'
}

export type ZipImportError = OperationFailure<ZipImportErrorKind>;

export const ZipImportErrors: Readonly<Record<ZipImportErrorKind, ZipImportError>> = {
	[ZipImportErrorKind.INVALID_FORMAT]: {
		kind: ZipImportErrorKind.INVALID_FORMAT,
		message: 'The provided data is not a valid zip archive'
	},
	[ZipImportErrorKind.READ_FAILED]: {
		kind: ZipImportErrorKind.READ_FAILED,
		message: 'Failed to read content from the archive'
	},
	[ZipImportErrorKind.STRUCTURE_INVALID]: {
		kind: ZipImportErrorKind.STRUCTURE_INVALID,
		message: 'The archive structure cannot be mapped to the file system'
	}
};

export interface ImportedFileSystemState {
	readonly fileSystemMap: FileSystemMapReadonly;
	readonly rootNodeID: NodeID;
}

export interface ZipImportOptions {
	readonly promoteRoot: boolean;
}

export interface IFileSystemZipImporter {
	import(
		zipData: Blob,
		options?: ZipImportOptions
	): Promise<Result<ImportedFileSystemState, ZipImportError>>;
}

export interface IZipInputStrategy<T> {
	prepare(input: T): Promise<Result<Blob, Error>>;
}
