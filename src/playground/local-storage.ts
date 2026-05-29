// Tiny localStorage wrapper used by the playground config service.
// Playground-only — outside src/lib/, not published.

export interface IPersistentStorage<T> {
	get(): T | null;
	set(value: T): void;
}

export class LocalStorageItem<T> implements IPersistentStorage<T> {
	private readonly storageKey: string;
	private readonly defaultValue: T;

	constructor(opts: { storageKey: string; defaultValue: T }) {
		this.storageKey = opts.storageKey;
		this.defaultValue = opts.defaultValue;
	}

	get(): T | null {
		if (typeof localStorage === 'undefined') {
			return null;
		}
		const raw: string | null = localStorage.getItem(this.storageKey);
		if (raw === null) {
			return null;
		}
		try {
			return JSON.parse(raw) as T;
		} catch {
			return this.defaultValue;
		}
	}

	set(value: T): void {
		if (typeof localStorage === 'undefined') {
			return;
		}
		localStorage.setItem(this.storageKey, JSON.stringify(value));
	}
}
