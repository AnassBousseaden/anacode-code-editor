import type { editor } from 'monaco-editor';
import type { IEditorDocument } from '$lib/core/editor/document/editor-document';
import { get, type Unsubscriber } from 'svelte/store';
import {
	type EditorConfiguration,
	type EditorModelConfiguration,
	type GlobalEditorConfiguration,
	type IEditorConfigurationService,
	StaticDefaultEditorConfigurationService
} from '$lib/core/editor/configuration/editor-config-models';
import type { ICodeEditorComponentController } from './code-editor-controller';
import type { IMonacoRuntime } from '$lib/core/editor/monaco/monaco-runtime';

function mapLineNumbersOption(showLineNumbers: boolean): 'on' | 'off' {
	if (showLineNumbers) {
		return 'on';
	}
	return 'off';
}

function createEditorConstructionOptions(
	editorConfiguration: EditorConfiguration,
	editorModelConfiguration: EditorModelConfiguration,
	globalEditorConfiguration: GlobalEditorConfiguration
): editor.IStandaloneEditorConstructionOptions {
	const lineNumbersOption: 'on' | 'off' = mapLineNumbersOption(editorConfiguration.showLineNumbers);

	const result: editor.IStandaloneEditorConstructionOptions = {
		model: null,
		theme: globalEditorConfiguration.theme,
		automaticLayout: true,
		fontSize: editorConfiguration.fontSize,
		tabSize: editorModelConfiguration.tabSize,
		fontFamily: editorConfiguration.fontFamily,
		wordWrap: editorConfiguration.wordWrap,
		lineNumbers: lineNumbersOption,
		minimap: {
			enabled: editorConfiguration.minimapEnabled
		}
	};

	return result;
}

export class CodeEditorComponentController implements ICodeEditorComponentController {
	private editorInstance: editor.IStandaloneCodeEditor | null;
	private currentEditorDocument: IEditorDocument | null;
	private editorConfiguration: EditorConfiguration;
	private readonly monacoRuntime: IMonacoRuntime;
	private readonly configurationService: IEditorConfigurationService;
	private readonly editorConfigUnsubscriber: Unsubscriber;
	private readonly globalConfigUnsubscriber: Unsubscriber;
	private readonly modelConfigUnsubscriber: Unsubscriber;

	constructor(
		monacoRuntime: IMonacoRuntime,
		configurationService: IEditorConfigurationService = new StaticDefaultEditorConfigurationService()
	) {
		this.monacoRuntime = monacoRuntime;
		this.configurationService = configurationService;
		this.editorInstance = null;
		this.currentEditorDocument = null;
		this.editorConfiguration = get(configurationService.editorConfiguration);

		this.editorConfigUnsubscriber = configurationService.editorConfiguration.subscribe(
			(editorConfiguration: EditorConfiguration): void => {
				this.onEditorConfigurationChanged(editorConfiguration);
			}
		);

		this.globalConfigUnsubscriber = configurationService.editorGlobalConfig.subscribe(
			(globalConfig: GlobalEditorConfiguration): void => {
				this.onGlobalConfigurationChanged(globalConfig);
			}
		);

		this.modelConfigUnsubscriber = configurationService.editorModelConfig.subscribe(
			(modelConfig: EditorModelConfiguration): void => {
				this.onModelConfigurationChanged(modelConfig);
			}
		);
	}

	attach(domElement: HTMLElement): void {
		if (this.editorInstance !== null) {
			return;
		}
		const constructionOptions: editor.IStandaloneEditorConstructionOptions =
			createEditorConstructionOptions(
				this.editorConfiguration,
				get(this.configurationService.editorModelConfig),
				get(this.configurationService.editorGlobalConfig)
			);
		this.editorInstance = this.monacoRuntime.editor.create(domElement, constructionOptions);

		if (this.currentEditorDocument !== null) {
			this.editorInstance.setModel(this.currentEditorDocument.model);
			const isReadonly: boolean = this.currentEditorDocument.getDocumentOptions().isReadOnly;
			this.editorInstance.updateOptions({ readOnly: isReadonly });
		}
	}

	detach(): void {
		if (this.editorInstance === null) {
			return;
		}
		this.editorInstance.dispose();
		this.editorInstance = null;
	}

	openDocument(newEditorDocument: IEditorDocument | null): void {
		this.currentEditorDocument = newEditorDocument;

		if (this.editorInstance === null) {
			return;
		}

		if (newEditorDocument === null) {
			this.editorInstance.setModel(null);
			return;
		}

		this.editorInstance.setModel(newEditorDocument.model);

		const isReadonly: boolean = newEditorDocument.getDocumentOptions().isReadOnly;
		this.editorInstance.updateOptions({ readOnly: isReadonly });
	}

	updateConfiguration(config: EditorConfiguration): void {
		this.onEditorConfigurationChanged(config);
	}

	saveCurrentView(): editor.ICodeEditorViewState | null {
		if (this.editorInstance === null) {
			return null;
		}

		return this.editorInstance.saveViewState();
	}

	restoreView(viewState: editor.ICodeEditorViewState): void {
		if (this.editorInstance === null) {
			return;
		}

		this.editorInstance.restoreViewState(viewState);
	}

	focus(): void {
		if (this.editorInstance === null) {
			return;
		}

		this.editorInstance.focus();
	}

	dispose(): void {
		this.editorConfigUnsubscriber();
		this.globalConfigUnsubscriber();
		this.modelConfigUnsubscriber();

		if (this.editorInstance !== null) {
			this.editorInstance.dispose();
			this.editorInstance = null;
		}

		this.currentEditorDocument = null;
	}

	private onEditorConfigurationChanged(config: EditorConfiguration): void {
		this.editorConfiguration = config;

		if (this.editorInstance === null) {
			return;
		}

		const lineNumbersOption: 'on' | 'off' = mapLineNumbersOption(config.showLineNumbers);

		const editorOptions: editor.IEditorOptions = {
			fontSize: config.fontSize,
			fontFamily: config.fontFamily,
			wordWrap: config.wordWrap,
			lineNumbers: lineNumbersOption,
			minimap: {
				enabled: config.minimapEnabled
			}
		};

		this.editorInstance.updateOptions(editorOptions);
	}

	private onGlobalConfigurationChanged(config: GlobalEditorConfiguration): void {
		if (this.editorInstance === null) {
			return;
		}

		this.editorInstance.updateOptions({ theme: config.theme });
	}

	private onModelConfigurationChanged(config: EditorModelConfiguration): void {
		if (this.editorInstance === null) {
			return;
		}

		this.editorInstance.updateOptions({ tabSize: config.tabSize });
	}
}
