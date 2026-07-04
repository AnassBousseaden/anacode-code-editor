import { en, type EditorMessageKey } from '$lib/core/localization/messages/en';
import { fr } from '$lib/core/localization/messages/fr';
import { es } from '$lib/core/localization/messages/es';

export type { EditorMessageKey };

/** Locales shipped with the editor. Only `en` is complete; the rest are overlays. */
export type EditorLocale = 'en' | 'fr' | 'es';

/** Runtime values substituted into `{token}` placeholders by {@link formatMessage}. */
export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * A partial catalog: an overlay (locale or consumer override) that need only
 * carry the keys it changes. Missing keys fall back to English.
 */
export type EditorMessageCatalog = Readonly<Partial<Record<EditorMessageKey, string>>>;

/** A fully-resolved, frozen message record — every key present, ready to render. */
export type EditorMessages = Readonly<Record<EditorMessageKey, string>>;

/**
 * Consumer-facing localization configuration, passed to the session factory.
 *
 * Both fields are optional: omit everything for English. `overrides` win over
 * the selected `locale`, which wins over English.
 */
export interface EditorLocalizationOptions {
	readonly locale?: EditorLocale;
	readonly overrides?: EditorMessageCatalog;
}

const LOCALE_CATALOGS: Readonly<Record<Exclude<EditorLocale, 'en'>, EditorMessageCatalog>> = {
	fr,
	es
};

/**
 * Resolve the final message record once, at session creation.
 *
 * Precedence (highest last): English base → selected locale overlay →
 * consumer overrides. The result is frozen and never mutated afterwards.
 */
export function resolveEditorMessages(options?: EditorLocalizationOptions): EditorMessages {
	const localeCatalog: EditorMessageCatalog =
		options?.locale && options.locale !== 'en' ? LOCALE_CATALOGS[options.locale] : {};
	const overrides: EditorMessageCatalog = options?.overrides ?? {};
	return Object.freeze({ ...en, ...localeCatalog, ...overrides });
}

/**
 * Resolve a presentation-edge label: map a domain id to its message key, then
 * to the localized string. Generic over the id union so every command family
 * shares one implementation.
 */
export function resolveLabel<TId extends string>(
	labelKeys: Readonly<Record<TId, EditorMessageKey>>,
	messages: EditorMessages,
	id: TId
): string {
	return messages[labelKeys[id]];
}

/**
 * Resolve a presentation-edge error content string: map an error kind to its
 * message key, then interpolate the error's params into the localized template.
 * Generic over the kind union so every command family shares one implementation.
 */
export function resolveErrorContent<TKind extends string>(
	errorKeys: Readonly<Record<TKind, EditorMessageKey>>,
	messages: EditorMessages,
	error: { readonly kind: TKind; readonly params?: MessageParams }
): string {
	return formatMessage(messages[errorKeys[error.kind]], error.params);
}

/**
 * Substitute `{token}` placeholders in `template` with values from `params`.
 *
 * Pure and locale-unaware: `String(value)` is used for each match. Unknown
 * tokens (no matching param key) are left intact. With no params the template
 * is returned unchanged.
 */
export function formatMessage(template: string, params?: MessageParams): string {
	if (!params) {
		return template;
	}
	return template.replace(/\{(\w+)\}/g, (match: string, token: string): string => {
		const value: string | number | undefined = params[token];
		return value === undefined ? match : String(value);
	});
}
