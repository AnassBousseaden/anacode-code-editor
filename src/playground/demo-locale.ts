// Demo-app locale persistence for the playground.
//
// The demo plays the host-app role: it persists the chosen locale, reloads the
// page, loads Monaco's global NLS pack early (see src/hooks.client.ts), and then
// creates editor sessions with the stored locale. Playground-only — outside
// src/lib/, not published.

import type { EditorLocale } from '$lib';

const DEMO_LOCALE_STORAGE_KEY: string = 'anacode-demo-locale';

const SUPPORTED_LOCALES: readonly EditorLocale[] = ['en', 'fr', 'es'];
const DEFAULT_LOCALE: EditorLocale = 'en';

function isEditorLocale(value: string | null): value is EditorLocale {
	return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Reads the persisted demo locale from localStorage, validated against the
 * supported set. Falls back to `'en'` when unset, invalid, or when
 * window/localStorage is unavailable (SSR / prerender).
 */
export function getDemoLocale(): EditorLocale {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_LOCALE;
	}
	const raw: string | null = localStorage.getItem(DEMO_LOCALE_STORAGE_KEY);
	return isEditorLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * Persists the chosen demo locale and reloads the page.
 *
 * The reload is required: Monaco 0.55 localizes its own UI (context menu, find
 * widget, …) through a page-global NLS pack that is bound when the
 * `monaco-editor` module first evaluates. That binding cannot change at
 * runtime, so switching languages must re-bootstrap the page (see
 * src/hooks.client.ts, which loads the pack before monaco evaluates).
 */
export function setDemoLocale(locale: EditorLocale): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(DEMO_LOCALE_STORAGE_KEY, locale);
	window.location.reload();
}
