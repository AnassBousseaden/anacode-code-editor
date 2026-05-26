import nightOwl from './Night Owl.json';
import tomorrowTheme from './Tomorrow.json';
import { editor } from 'monaco-editor';
import { CodeEditorTheme } from '$lib/core/editor/configuration/editor-config-models';

export { updateTheme };

export function initCodeEditorThemes(): void {
	const nightOwlVsCodeTheme: editor.IStandaloneThemeData = nightOwl as editor.IStandaloneThemeData;
	const tomorrowVsCodeTheme: editor.IStandaloneThemeData =
		tomorrowTheme as editor.IStandaloneThemeData;

	editor.defineTheme(CodeEditorTheme.DARK, nightOwlVsCodeTheme);
	editor.defineTheme(CodeEditorTheme.LIGHT, tomorrowVsCodeTheme);
}

function updateTheme(isDark: boolean): void {
	const codeEditorTheme: CodeEditorTheme = isDark ? CodeEditorTheme.DARK : CodeEditorTheme.LIGHT;
	editor.setTheme(codeEditorTheme);
}
