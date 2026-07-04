import { describe, expect, it, vi } from 'vitest';

// Importing an entry point must never evaluate `monaco-editor` (it touches
// browser globals, breaking SSR). The mock turns any evaluation into a failure.
vi.mock('monaco-editor', (): never => {
	throw new Error('monaco-editor was evaluated while importing a package entry point');
});

describe('SSR safety: entry points must not evaluate monaco-editor', () => {
	it('imports the session entry in a browserless environment', async () => {
		const module: typeof import('$lib/session') = await import('$lib/session');
		expect(module.EditorSessionFactory).toBeDefined();
		expect(module.MonacoRuntimeProvider).toBeDefined();
	});

	// 60s: the root entry's Svelte component tree is slow to transform cold.
	it('imports the root entry in a browserless environment', { timeout: 60000 }, async () => {
		const module: typeof import('$lib/index') = await import('$lib/index');
		expect(module.EditorSessionFactory).toBeDefined();
		expect(module.EditorSession).toBeDefined();
	});
});
