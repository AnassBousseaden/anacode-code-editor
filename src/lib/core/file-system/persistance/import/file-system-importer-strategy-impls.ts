import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import type { IZipInputStrategy } from '$lib/core/file-system/persistance/import/file-system-import';

const BASE64_DATA_URI_PREFIX: string = 'data:application/zip;base64,';
const BASE64_STRATEGY_ERROR_MESSAGE: string = 'Failed to decode base64 string';

const GITHUB_API_BASE_URL: string = 'https://api.github.com/repos';
const GITHUB_ERROR_NOT_FOUND: string = 'Repository not found';
const GITHUB_ERROR_ACCESS_DENIED: string = 'Access denied - check token permissions';
const GITHUB_ERROR_RATE_LIMITED: string = 'GitHub API rate limit exceeded';
const GITHUB_ERROR_NETWORK: string = 'Failed to fetch repository from GitHub';

export interface GitHubRepositoryConfig {
	readonly owner: string;
	readonly repo: string;
	readonly branch: string;
	readonly token?: string;
}

export class ZipFileInputStrategy implements IZipInputStrategy<File> {
	public async prepare(input: File): Promise<Result<Blob, Error>> {
		return success(input);
	}
}

export class ZipBase64InputStrategy implements IZipInputStrategy<string> {
	public async prepare(input: string): Promise<Result<Blob, Error>> {
		const dataUri: string = this.ensureDataUri(input);

		try {
			const response: Response = await fetch(dataUri);

			if (!response.ok) {
				return failure(new Error(BASE64_STRATEGY_ERROR_MESSAGE));
			}

			const blob: Blob = await response.blob();
			return success(blob);
		} catch {
			return failure(new Error(BASE64_STRATEGY_ERROR_MESSAGE));
		}
	}

	private ensureDataUri(input: string): string {
		if (input.startsWith(BASE64_DATA_URI_PREFIX)) {
			return input;
		}

		if (input.startsWith('data:')) {
			return input;
		}

		return BASE64_DATA_URI_PREFIX + input;
	}
}

export class ZipGitHubInputStrategy implements IZipInputStrategy<GitHubRepositoryConfig> {
	public async prepare(input: GitHubRepositoryConfig): Promise<Result<Blob, Error>> {
		const url: string = this.buildUrl(input);
		const headers: Headers = this.buildHeaders(input.token);

		try {
			const response: Response = await fetch(url, { headers });

			if (!response.ok) {
				const error: Error = this.mapHttpError(response.status);
				return failure(error);
			}

			const blob: Blob = await response.blob();
			return success(blob);
		} catch {
			return failure(new Error(GITHUB_ERROR_NETWORK));
		}
	}

	private buildUrl(config: GitHubRepositoryConfig): string {
		return `${GITHUB_API_BASE_URL}/${config.owner}/${config.repo}/zipball/${config.branch}`;
	}

	private buildHeaders(token: string | undefined): Headers {
		const headers: Headers = new Headers();
		headers.set('Accept', 'application/vnd.github+json');

		if (token !== undefined) {
			headers.set('Authorization', `Bearer ${token}`);
		}

		return headers;
	}

	private mapHttpError(status: number): Error {
		if (status === 404) {
			return new Error(GITHUB_ERROR_NOT_FOUND);
		}

		if (status === 403) {
			return new Error(GITHUB_ERROR_ACCESS_DENIED);
		}

		if (status === 429) {
			return new Error(GITHUB_ERROR_RATE_LIMITED);
		}

		return new Error(GITHUB_ERROR_NETWORK);
	}
}
