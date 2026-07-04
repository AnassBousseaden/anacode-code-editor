/**
 * Localization: the typed message packs and the Svelte context accessors for
 * the resolved record. One frozen `EditorMessages` is resolved at session
 * creation; `en` is complete, `fr`/`es` are partial overlays.
 *
 * @module @anacode/code-editor/localization
 */
export * from '$lib/core/localization/localization-models';
export * from '$lib/core/localization/messages-context';
export { en } from '$lib/core/localization/messages/en';
export { fr } from '$lib/core/localization/messages/fr';
export { es } from '$lib/core/localization/messages/es';
