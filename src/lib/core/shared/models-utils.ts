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
	/**
	 * Runtime values for presentation-layer message interpolation (e.g. a
	 * conflicting file `name`). Kept localization-free on purpose: the domain
	 * only carries the raw values, and the presentation edge maps the error
	 * kind to a localized template and substitutes these params. `message`
	 * stays a diagnostic English string for logs.
	 */
	readonly params?: Readonly<Record<string, string | number>>;
	/**
	 * Stable machine-readable discriminant for presentation-layer mapping (e.g.
	 * selecting a distinct localized template). Unlike `message`, which stays a
	 * diagnostic English string, `code` is safe for equality checks across
	 * boundaries.
	 */
	readonly code?: string;
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
