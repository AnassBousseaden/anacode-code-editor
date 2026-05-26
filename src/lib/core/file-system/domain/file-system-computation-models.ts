import type {
	EventID,
	NodeID,
	ValidationResult
} from '$lib/core/file-system/domain/file-system-models';

export function valid<T>(value: T): ValidationResult<T> {
	return { ok: true, value };
}

export function invalid<T>(message: string): ValidationResult<T> {
	return { ok: false, error: { message } };
}

export interface IIDGenerator<T> {
	generate(): T;
}

export type INodeIDGenerator = IIDGenerator<NodeID>;
export type IEventIDGenerator = IIDGenerator<EventID>;

export interface ITimestampProvider {
	now(): number;
}
