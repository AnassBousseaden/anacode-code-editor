import { readable, type Readable } from 'svelte/store';

export enum CodeEditorTheme {
	DARK = 'night-owl-dark',
	LIGHT = 'tomorrow-light'
}

export const codeEditorFont = "'JetBrains Mono', 'Fira Code', monospace";

export interface EditorModelConfiguration {
	readonly tabSize: number;
}

export interface GlobalEditorConfiguration {
	readonly theme: CodeEditorTheme;
}

export interface EditorConfiguration {
	readonly fontSize: number;
	readonly fontFamily: string;
	readonly wordWrap: 'on' | 'off';
	readonly showLineNumbers: boolean;
	readonly minimapEnabled: boolean;
}

export const DEFAULT_GLOBAL_CONFIG: GlobalEditorConfiguration = {
	theme: CodeEditorTheme.LIGHT
};

export const DEFAULT_EDITOR_MODEL_CONFIG: EditorModelConfiguration = {
	tabSize: 4
};

export const DEFAULT_CONFIG: EditorConfiguration = {
	fontSize: 16,
	wordWrap: 'on',
	showLineNumbers: true,
	minimapEnabled: false,
	fontFamily: codeEditorFont
};

export interface IEditorConfigurationService {
	readonly editorConfiguration: Readable<EditorConfiguration>;
	readonly editorModelConfig: Readable<EditorModelConfiguration>;
	readonly editorGlobalConfig: Readable<GlobalEditorConfiguration>;

	initialize(): Promise<void>;

	updateGlobalConfigs(
		newOptions: Partial<EditorConfiguration & EditorModelConfiguration & GlobalEditorConfiguration>
	): void;

	setFontSize(fontSize: number): void;

	setTabSize(tabSize: number): void;
}

export class StaticDefaultEditorConfigurationService implements IEditorConfigurationService {
	readonly editorConfiguration: Readable<EditorConfiguration>;
	readonly editorModelConfig: Readable<EditorModelConfiguration>;
	readonly editorGlobalConfig: Readable<GlobalEditorConfiguration>;

	constructor() {
		this.editorConfiguration = readable(DEFAULT_CONFIG);
		this.editorGlobalConfig = readable(DEFAULT_GLOBAL_CONFIG);
		this.editorModelConfig = readable(DEFAULT_EDITOR_MODEL_CONFIG);
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	initialize(): Promise<void> {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	updateGlobalConfigs(newOptions: Partial<EditorConfiguration>): void {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setFontSize(fontSize: number): void {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setTabSize(tabSize: number): void {}
}
