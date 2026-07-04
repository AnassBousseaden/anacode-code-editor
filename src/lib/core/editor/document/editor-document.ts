import type { editor } from 'monaco-editor';
import type { Brand, IDisposable1 } from '$lib/core/shared/models-utils';

export interface EditorDocumentOptions {
	fileURI: string;
	content: string;
	isReadOnly: boolean;
}

export interface EditorConfigurableDocumentOptions {
	tabSize?: number;
	insertSpaces?: boolean;
}

export type EditorDocumentID = Brand<number, 'EditorDocumentID'>;

export interface IEditorDocument extends IDisposable1 {
	readonly id: EditorDocumentID;

	readonly model: editor.ITextModel;

	getDocumentOptions(): EditorDocumentOptions;

	updateOptions(options: EditorConfigurableDocumentOptions): void;
}
