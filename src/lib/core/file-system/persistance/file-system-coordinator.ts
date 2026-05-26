import type {
	IZipOutputStrategy,
	ZipExportError,
	ZipExportOptions
} from '$lib/core/file-system/persistance/export/file-system-exporter';
import type {
	ImportedFileSystemState,
	IZipInputStrategy,
	ZipImportError,
	ZipImportOptions
} from '$lib/core/file-system/persistance/import/file-system-import';
import type { Result } from '$lib/core/shared/models-utils';
import type { FileSystemMapReadonly } from '$lib/core/file-system/domain/file-system-models';

export interface IFileSystemZipCoordinator {
	import<T>(
		input: T,
		strategy: IZipInputStrategy<T>,
		options?: ZipImportOptions
	): Promise<Result<ImportedFileSystemState, ZipImportError | Error>>;

	export<T>(
		state: FileSystemMapReadonly,
		options: ZipExportOptions,
		strategy: IZipOutputStrategy<Result<T, Error>>
	): Promise<Result<T, ZipExportError | Error>>;
}
