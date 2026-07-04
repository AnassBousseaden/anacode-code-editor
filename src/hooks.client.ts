// Client hook: load Monaco's global NLS pack BEFORE the app evaluates monaco.
//
// Monaco 0.55 localizes its own UI (context menu, find widget, command
// palette, …) through a single page-global NLS message table that is bound
// when the `monaco-editor` module first evaluates. There is no per-instance
// override and no way to re-bind it at runtime — the locale is fixed for the
// life of the page. To show a non-English Monaco UI we must therefore import
// the matching `nls.messages.<locale>.js` pack (which registers itself as a
// side effect) before any module that transitively imports `monaco-editor`
// runs.
//
// SvelteKit lazily code-splits every route: route components are dynamically
// imported by the client router only after `hooks.client.ts` has resolved.
// The top-level `await` below therefore delays app startup until the pack is
// registered, guaranteeing monaco cannot evaluate first. English needs no
// pack (it is monaco's built-in default), so we skip the import entirely.
//
// The import specifiers are string literals so Vite can statically analyse and
// pre-bundle them.

import { getDemoLocale } from '$playground/demo-locale';
import type { EditorLocale } from '$lib';

const locale: EditorLocale = getDemoLocale();

if (locale === 'fr') {
	// @ts-expect-error — monaco ships this NLS pack as a bare .js with no types.
	await import('monaco-editor/esm/nls.messages.fr.js');
} else if (locale === 'es') {
	// @ts-expect-error — monaco ships this NLS pack as a bare .js with no types.
	await import('monaco-editor/esm/nls.messages.es.js');
}
