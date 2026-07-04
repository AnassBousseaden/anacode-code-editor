/**
 * @anacode/code-editor — a self-contained, reusable multi-file code editor on Monaco.
 *
 * This root entry exposes the drop-in surface: render `EditorSession` with an
 * `IEditorSession` produced by `EditorSessionFactory`, plus the universally needed
 * file-system models and shared types.
 *
 * Power composers who assemble the stack themselves should import from the
 * concern-scoped entry points, each of which exposes its full surface:
 *
 *   - `@anacode/code-editor/file-system`  — models, service, loader, command factory
 *   - `@anacode/code-editor/persistence`  — zip import/export + strategies
 *   - `@anacode/code-editor/session`      — session interfaces, factory, errors
 *   - `@anacode/code-editor/state`        — user-space and related state services
 *   - `@anacode/code-editor/config`       — editor configuration service
 *   - `@anacode/code-editor/localization` — message catalogs, resolver, context
 *   - `@anacode/code-editor/icons`        — Icon component + icon factories
 *   - `@anacode/code-editor/shared`       — Result, Brand, IDisposable1, errors
 *
 * Anything not promoted here remains reachable via deep subpath imports
 * (`@anacode/code-editor/core/...`, `.../components/...`, `.../view-models/...`).
 */

// Drop-in component.
export { default as EditorSession } from '$lib/components/EditorSession.svelte';

// The assembled session: interfaces, factory, errors.
export * from '$lib/core/session/editor-session';
export * from '$lib/core/session/editor-session-factory-impl';

// The Monaco runtime boundary the factory loads Monaco through.
export * from '$lib/core/editor/monaco/monaco-runtime';
export * from '$lib/core/editor/monaco/monaco-runtime-provider-impl';

// Localization configuration types needed to localize the drop-in session.
export type {
	EditorLocale,
	EditorLocalizationOptions,
	EditorMessageCatalog,
	EditorMessageKey,
	EditorMessages
} from '$lib/core/localization/localization-models';

// Universally needed primitives.
export * from '$lib/core/file-system/domain/file-system-models';
export * from '$lib/core/shared/models-utils';
