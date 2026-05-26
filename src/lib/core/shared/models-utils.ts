import type { Unsubscriber } from 'svelte/store';

export type Result<T, E = OperationError> = { ok: true; value: T } | { ok: false; error: E };

export type Brand<K, T> = K & { __brand: T };

export type MutableUtils<T> = {
	-readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P];
};

export interface IDisposable1 {
	dispose(): void;
}

export interface IInitializable<T, E> {
	initialize(): Promise<Result<T, E>>;
}

export type TransactionListener<TTransaction> = (transaction: TTransaction) => void;

export interface ITransactionEventSource<TTransaction> {
	onTransaction(listener: TransactionListener<TTransaction>): Unsubscriber;
}

export interface OperationError {
	readonly message: string;
}

export interface OperationFailure<K extends string> extends OperationError {
	readonly kind: K;
}

export function success<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function failure<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

export function generateRandomID(): number {
	return Math.floor(Math.random() * 1_000_000);
}
