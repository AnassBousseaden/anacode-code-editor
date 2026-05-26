import { generateRandomID } from '$lib/core/shared/models-utils';
import type { FileSystemPath } from '$lib/core/file-system/domain/file-system-models';
import type { IFileURIBuilder } from '$lib/core/workspace/sync/document-record/file-uri-builder';

export class FileURIBuilder implements IFileURIBuilder {
	private readonly namespace: string;

	public constructor(namespace?: string) {
		this.namespace = namespace ?? `workspace-${generateRandomID()}`;
	}

	public build(path: FileSystemPath): string {
		return `file://${this.namespace}${path}`;
	}
}
