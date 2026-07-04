import { EditorLocale } from '$lib';

const DEMO_LOCALE_STORAGE_KEY: string = 'anacode-demo-locale';

const DEFAULT_LOCALE: EditorLocale = EditorLocale.EN;

function isEditorLocale(value: string | null): value is EditorLocale {
	return value !== null && (Object.values(EditorLocale) as string[]).includes(value);
}

export function getDemoLocale(): EditorLocale {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_LOCALE;
	}
	const raw: string | null = localStorage.getItem(DEMO_LOCALE_STORAGE_KEY);
	return isEditorLocale(raw) ? raw : DEFAULT_LOCALE;
}

// Monaco binds its NLS pack page-wide at first evaluation, so a locale switch
// must re-bootstrap the page.
export function setDemoLocale(locale: EditorLocale): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(DEMO_LOCALE_STORAGE_KEY, locale);
	window.location.reload();
}
