import type { IZipOutputStrategy } from '$lib/core/file-system/persistance/export/file-system-exporter';
import { failure, type Result, success } from '$lib/core/shared/models-utils';

export class ZipFileOutputStrategy implements IZipOutputStrategy<Result<File, Error>> {
	private readonly fileName: string;

	constructor(fileName: string) {
		this.fileName = fileName;
	}

	public async process(data: Blob): Promise<Result<File, Error>> {
		const file: File = new File([data], this.fileName, { type: data.type });
		return success(file);
	}
}

const BASE64_STRATEGY_ERROR_MESSAGE: string = 'Failed to read blob as base64';
const DEFAULT_ZIP_FILENAME: string = 'project.zip';

export class ZipBrowserDownloadStrategy implements IZipOutputStrategy<Result<void, Error>> {
	private readonly fileName: string;

	constructor(fileName?: string) {
		this.fileName = fileName ?? DEFAULT_ZIP_FILENAME;
	}

	public async process(data: Blob): Promise<Result<void, Error>> {
		const url: string = URL.createObjectURL(data);
		const anchor: HTMLAnchorElement = document.createElement('a');

		anchor.href = url;
		anchor.download = this.fileName;
		anchor.style.display = 'none';

		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);

		URL.revokeObjectURL(url);

		return success(undefined);
	}
}

export class ZipBase64OutputStrategy implements IZipOutputStrategy<Result<string, Error>> {
	public process(data: Blob): Promise<Result<string, Error>> {
		return new Promise<Result<string, Error>>(
			(resolve: (value: Result<string, Error>) => void): void => {
				const reader: FileReader = new FileReader();

				reader.onload = (): void => {
					const dataUrl: string = reader.result as string;
					const base64String: string = dataUrl.split(',')[1];
					resolve(success(base64String));
				};

				reader.onerror = (): void => {
					const error: Error = new Error(reader.error?.message ?? BASE64_STRATEGY_ERROR_MESSAGE);
					resolve(failure(error));
				};

				reader.readAsDataURL(data);
			}
		);
	}
}
