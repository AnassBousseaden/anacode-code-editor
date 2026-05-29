/**
 * Editor session: the high-level composition that bundles the editor, file tree,
 * tabs, selection, and projections behind a single IEditorSession.
 *
 * This is the "assembled thing". For the building blocks it wires up, see the
 * `file-system`, `persistence`, `state`, and `config` entry points.
 *
 * @module @anacode/code-editor/session
 */
export * from '$lib/core/session/editor-session';
export * from '$lib/core/session/editor-session-factory-impl';
export * from '$lib/core/session/editor-session-impl';
