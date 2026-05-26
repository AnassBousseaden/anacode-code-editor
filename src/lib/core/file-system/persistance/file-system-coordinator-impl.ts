import type {
	IFileSystemZipExporter,
	IZipOutputStrategy,
	ZipExportError,
	ZipExportOptions
} from '$lib/core/file-system/persistance/export/file-system-exporter';
import type {
	IFileSystemZipImporter,
	ImportedFileSystemState,
	IZipInputStrategy,
	ZipImportError,
	ZipImportOptions
} from '$lib/core/file-system/persistance/import/file-system-import';
import type { FileSystemMapReadonly } from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { failure } from '$lib/core/shared/models-utils';
import type { IFileSystemZipCoordinator } from '$lib/core/file-system/persistance/file-system-coordinator';
import { FileSystemZipImporter } from '$lib/core/file-system/persistance/import/file-system-importer-impl';
import { FileSystemZipExporter } from '$lib/core/file-system/persistance/export/file-system-exporter-impl';

export class FileSystemZipCoordinator implements IFileSystemZipCoordinator {
	private readonly importer: IFileSystemZipImporter;
	private readonly exporter: IFileSystemZipExporter;

	constructor(
		importer: IFileSystemZipImporter = new FileSystemZipImporter(),
		exporter: IFileSystemZipExporter = new FileSystemZipExporter()
	) {
		this.importer = importer;
		this.exporter = exporter;
	}

	public async import<T>(
		input: T,
		strategy: IZipInputStrategy<T>,
		options?: ZipImportOptions
	): Promise<Result<ImportedFileSystemState, ZipImportError | Error>> {
		const prepareResult: Result<Blob, Error> = await strategy.prepare(input);

		if (!prepareResult.ok) {
			return failure(prepareResult.error);
		}

		const blob: Blob = prepareResult.value;
		const importResult: Result<ImportedFileSystemState, ZipImportError> =
			await this.importer.import(blob, options);

		if (!importResult.ok) {
			return failure(importResult.error);
		}

		return importResult;
	}

	public async export<T>(
		state: FileSystemMapReadonly,
		options: ZipExportOptions,
		strategy: IZipOutputStrategy<Result<T, Error>>
	): Promise<Result<T, ZipExportError | Error>> {
		const exportResult: Result<Blob, ZipExportError> = await this.exporter.export(state, options);

		if (!exportResult.ok) {
			return failure(exportResult.error);
		}

		const blob: Blob = exportResult.value;
		const strategyResult: Result<T, Error> = await strategy.process(blob);

		if (!strategyResult.ok) {
			return failure(strategyResult.error);
		}

		return strategyResult;
	}
}
