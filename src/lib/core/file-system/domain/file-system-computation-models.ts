import type {
	EventID,
	NodeID,
	ValidationResult
} from '$lib/core/file-system/domain/file-system-models';

export function valid<T>(value: T): ValidationResult<T> {
	return { ok: true, value };
}

export function invalid<T>(
	message: string,
	params?: Readonly<Record<string, string | number>>,
	code?: string
): ValidationResult<T> {
	return {
		ok: false,
		error: {
			message,
			...(params !== undefined ? { params } : {}),
			...(code !== undefined ? { code } : {})
		}
	};
}

export interface IIDGenerator<T> {
	generate(): T;
}

export type INodeIDGenerator = IIDGenerator<NodeID>;
export type IEventIDGenerator = IIDGenerator<EventID>;

export interface ITimestampProvider {
	now(): number;
}
