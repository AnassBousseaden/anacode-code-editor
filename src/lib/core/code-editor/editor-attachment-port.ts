import type { editor } from 'monaco-editor';

import type { IEditorDocument } from '$lib/core/editor/document/editor-document';

/**
 * Narrow boundary that the orchestration service uses to drive the
 * Monaco-bound editor component without importing Monaco itself —
 * except for the opaque view-state type, which transits through.
 *
 * The implementation lives alongside the Monaco component controller
 * (UI layer) and routes these verbs to the controller's imperative
 * API. The orchestration stays domain-pure on this side of the port.
 */
export interface IEditorAttachmentPort {
	attach(document: IEditorDocument | null): void;
	focus(): void;
	saveCurrentView(): editor.ICodeEditorViewState | null;
	restoreView(viewState: editor.ICodeEditorViewState): void;
}
