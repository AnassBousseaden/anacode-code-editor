import type { editor } from 'monaco-editor';

import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';
import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import type { IEditorAttachmentPort } from '$lib/core/code-editor/editor-attachment-port';

export class EditorAttachmentPort implements IEditorAttachmentPort {
	private readonly componentController: ICodeEditorComponentController;

	public constructor(componentController: ICodeEditorComponentController) {
		this.componentController = componentController;
	}

	public attach(document: IEditorDocument | null): void {
		this.componentController.openDocument(document);
	}

	public focus(): void {
		this.componentController.focus();
	}

	public saveCurrentView(): editor.ICodeEditorViewState | null {
		return this.componentController.saveCurrentView();
	}

	public restoreView(viewState: editor.ICodeEditorViewState): void {
		this.componentController.restoreView(viewState);
	}
}
