import nightOwl from './Night Owl.json';
import tomorrowTheme from './Tomorrow.json';
import type { editor } from 'monaco-editor';
import { CodeEditorTheme } from '$lib/core/editor/configuration/editor-config-models';
import type { MonacoEditorNamespace } from '$lib/core/editor/monaco/monaco-runtime';

export { updateTheme };

export function initCodeEditorThemes(monacoEditor: MonacoEditorNamespace): void {
	const nightOwlVsCodeTheme: editor.IStandaloneThemeData = nightOwl as editor.IStandaloneThemeData;
	const tomorrowVsCodeTheme: editor.IStandaloneThemeData =
		tomorrowTheme as editor.IStandaloneThemeData;

	monacoEditor.defineTheme(CodeEditorTheme.DARK, nightOwlVsCodeTheme);
	monacoEditor.defineTheme(CodeEditorTheme.LIGHT, tomorrowVsCodeTheme);
}

function updateTheme(monacoEditor: MonacoEditorNamespace, isDark: boolean): void {
	const codeEditorTheme: CodeEditorTheme = isDark ? CodeEditorTheme.DARK : CodeEditorTheme.LIGHT;
	monacoEditor.setTheme(codeEditorTheme);
}
