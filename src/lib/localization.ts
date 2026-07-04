/**
 * Localization: message catalogs, the resolver/formatter helpers, and the
 * Svelte context accessors for the resolved message record.
 *
 * Localization is view data, not a service: one frozen record is resolved once
 * at session creation and read by components via context. Only `en` is complete;
 * `fr`/`es` are partial overlays that fall back to English.
 *
 * @module @anacode/code-editor/localization
 */
export * from '$lib/core/localization/localization-models';
export * from '$lib/core/localization/messages-context';
export { en } from '$lib/core/localization/messages/en';
export { fr } from '$lib/core/localization/messages/fr';
export { es } from '$lib/core/localization/messages/es';
