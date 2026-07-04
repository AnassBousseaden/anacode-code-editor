import type { editor } from 'monaco-editor';
import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import type { EditorConfiguration } from '$lib/core/editor/configuration/editor-config-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface ICodeEditorComponentController extends IDisposable1 {
	attach(domElement: HTMLElement): void;

	detach(): void;

	openDocument(document: IEditorDocument | null): void;

	updateConfiguration(config: EditorConfiguration): void;

	saveCurrentView(): editor.ICodeEditorViewState | null;

	restoreView(viewState: editor.ICodeEditorViewState | undefined): void;

	focus(): void;
}
