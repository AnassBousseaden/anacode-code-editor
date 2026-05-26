import type {
	ContentHash,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';

const ContentHashErrorMessages = {
	HASH_COMPUTATION_FAILED: (message: string): string =>
		`Content hash computation failed: ${message}`
} as const;

export enum DigestAlgorithm {
	SHA_1 = 'SHA-1',
	SHA_256 = 'SHA-256',
	SHA_384 = 'SHA-384',
	SHA_512 = 'SHA-512'
}

export interface IContentHashService {
	computeHash(content: string): Promise<Result<ContentHash, OperationError>>;
}

export class ContentHashService implements IContentHashService {
	private readonly algorithm: DigestAlgorithm;

	constructor(algorithm: DigestAlgorithm = DigestAlgorithm.SHA_1) {
		this.algorithm = algorithm;
	}

	async computeHash(content: string): Promise<Result<ContentHash, OperationError>> {
		try {
			const encoder: TextEncoder = new TextEncoder();
			const encoded: Uint8Array<ArrayBuffer> = encoder.encode(content);
			const hashBuffer: ArrayBuffer = await crypto.subtle.digest(this.algorithm, encoded);
			const hashArray: number[] = Array.from(new Uint8Array(hashBuffer));
			const hashHex: string = hashArray
				.map((byte: number): string => byte.toString(16).padStart(2, '0'))
				.join('');
			return success(hashHex as ContentHash);
		} catch (error: unknown) {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown hashing error';
			return failure({
				message: ContentHashErrorMessages.HASH_COMPUTATION_FAILED(errorMessage)
			});
		}
	}
}
