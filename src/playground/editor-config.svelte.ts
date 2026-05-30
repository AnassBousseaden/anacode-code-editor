// Singleton editor configuration service for the playground:
//   - persists to localStorage
//   - bridges mode-watcher dark/light into Monaco's theme reactively
//   - exposes updateGlobalConfigs / setFontSize / setTabSize for the settings modal
// Playground-only — outside src/lib/.

import { type Readable, type Writable, writable } from 'svelte/store';

import {
	CodeEditorTheme,
	DEFAULT_CONFIG,
	DEFAULT_EDITOR_MODEL_CONFIG,
	DEFAULT_GLOBAL_CONFIG,
	type EditorConfiguration,
	type EditorModelConfiguration,
	type GlobalEditorConfiguration,
	type IEditorConfigurationService
} from '$lib/config';

import { ThemeBridge } from './application-theme-bridge.svelte';
import { LocalStorageItem, type IPersistentStorage } from './local-storage';

const EDITOR_CONFIG_STORAGE_KEY: string = 'anacode_editor_configuration';
const EDITOR_MODEL_CONFIG_STORAGE_KEY: string = 'anacode_editor_model_configuration';
const EDITOR_GLOBAL_CONFIG_STORAGE_KEY: string = 'anacode_editor_global_configuration';

const EDITOR_CONFIG_KEYS: (keyof EditorConfiguration)[] = Object.keys(
	DEFAULT_CONFIG
) as (keyof EditorConfiguration)[];
const MODEL_CONFIG_KEYS: (keyof EditorModelConfiguration)[] = Object.keys(
	DEFAULT_EDITOR_MODEL_CONFIG
) as (keyof EditorModelConfiguration)[];
const GLOBAL_CONFIG_KEYS: (keyof GlobalEditorConfiguration)[] = Object.keys(
	DEFAULT_GLOBAL_CONFIG
) as (keyof GlobalEditorConfiguration)[];

type CombinedEditorOptions = Partial<
	EditorConfiguration & EditorModelConfiguration & GlobalEditorConfiguration
>;
type ThemeMode = 'light' | 'dark';

function pickKeys<T extends object, K extends keyof T>(
	source: Partial<T>,
	keys: K[]
): Partial<Pick<T, K>> {
	const result: Partial<Pick<T, K>> = {};
	for (const key of keys) {
		if (key in source) {
			result[key] = source[key] as T[K];
		}
	}
	return result;
}

export class EditorConfigurationService implements IEditorConfigurationService {
	private static instance: EditorConfigurationService | null = null;

	private readonly editorConfigurationStore: Writable<EditorConfiguration>;
	private readonly editorModelConfigStore: Writable<EditorModelConfiguration>;
	private readonly editorGlobalConfigStore: Writable<GlobalEditorConfiguration>;

	private readonly editorConfigStorage: IPersistentStorage<EditorConfiguration>;
	private readonly editorModelConfigStorage: IPersistentStorage<EditorModelConfiguration>;
	private readonly editorGlobalConfigStorage: IPersistentStorage<GlobalEditorConfiguration>;

	private themeBridge: ThemeBridge | null = null;

	private constructor() {
		this.editorConfigurationStore = writable<EditorConfiguration>(DEFAULT_CONFIG);
		this.editorModelConfigStore = writable<EditorModelConfiguration>(DEFAULT_EDITOR_MODEL_CONFIG);
		this.editorGlobalConfigStore = writable<GlobalEditorConfiguration>(DEFAULT_GLOBAL_CONFIG);

		this.editorConfigStorage = new LocalStorageItem<EditorConfiguration>({
			storageKey: EDITOR_CONFIG_STORAGE_KEY,
			defaultValue: DEFAULT_CONFIG
		});
		this.editorModelConfigStorage = new LocalStorageItem<EditorModelConfiguration>({
			storageKey: EDITOR_MODEL_CONFIG_STORAGE_KEY,
			defaultValue: DEFAULT_EDITOR_MODEL_CONFIG
		});
		this.editorGlobalConfigStorage = new LocalStorageItem<GlobalEditorConfiguration>({
			storageKey: EDITOR_GLOBAL_CONFIG_STORAGE_KEY,
			defaultValue: DEFAULT_GLOBAL_CONFIG
		});

		this.loadStoredConfigs();
		this.initializeThemeBridge();
	}

	public get editorConfiguration(): Readable<EditorConfiguration> {
		return this.editorConfigurationStore;
	}

	public get editorModelConfig(): Readable<EditorModelConfiguration> {
		return this.editorModelConfigStore;
	}

	public get editorGlobalConfig(): Readable<GlobalEditorConfiguration> {
		return this.editorGlobalConfigStore;
	}

	public static getInstance(): EditorConfigurationService {
		if (EditorConfigurationService.instance === null) {
			EditorConfigurationService.instance = new EditorConfigurationService();
		}
		return EditorConfigurationService.instance;
	}

	public async initialize(): Promise<void> {
		return Promise.resolve();
	}

	public updateGlobalConfigs(newOptions: CombinedEditorOptions): void {
		const editorOptions: Partial<EditorConfiguration> = pickKeys(newOptions, EDITOR_CONFIG_KEYS);
		const modelOptions: Partial<EditorModelConfiguration> = pickKeys(
			newOptions,
			MODEL_CONFIG_KEYS
		);
		const globalOptions: Partial<GlobalEditorConfiguration> = pickKeys(
			newOptions,
			GLOBAL_CONFIG_KEYS
		);

		if (Object.keys(editorOptions).length > 0) {
			this.editorConfigurationStore.update(
				(current: EditorConfiguration): EditorConfiguration => {
					const next: EditorConfiguration = { ...current, ...editorOptions };
					this.editorConfigStorage.set(next);
					return next;
				}
			);
		}

		if (Object.keys(modelOptions).length > 0) {
			this.editorModelConfigStore.update(
				(current: EditorModelConfiguration): EditorModelConfiguration => {
					const next: EditorModelConfiguration = { ...current, ...modelOptions };
					this.editorModelConfigStorage.set(next);
					return next;
				}
			);
		}

		if (Object.keys(globalOptions).length > 0) {
			this.editorGlobalConfigStore.update(
				(current: GlobalEditorConfiguration): GlobalEditorConfiguration => {
					const next: GlobalEditorConfiguration = { ...current, ...globalOptions };
					this.editorGlobalConfigStorage.set(next);
					return next;
				}
			);
		}
	}

	public setFontSize(fontSize: number): void {
		this.updateGlobalConfigs({ fontSize });
	}

	public setTabSize(tabSize: number): void {
		this.updateGlobalConfigs({ tabSize });
	}

	public dispose(): void {
		if (this.themeBridge !== null) {
			this.themeBridge.dispose();
			this.themeBridge = null;
		}
	}

	private loadStoredConfigs(): void {
		const storedEditorConfig: EditorConfiguration | null = this.editorConfigStorage.get();
		const storedModelConfig: EditorModelConfiguration | null = this.editorModelConfigStorage.get();
		const storedGlobalConfig: GlobalEditorConfiguration | null =
			this.editorGlobalConfigStorage.get();

		this.editorConfigurationStore.set(storedEditorConfig ?? DEFAULT_CONFIG);
		this.editorModelConfigStore.set(storedModelConfig ?? DEFAULT_EDITOR_MODEL_CONFIG);
		this.editorGlobalConfigStore.set(storedGlobalConfig ?? DEFAULT_GLOBAL_CONFIG);
	}

	private initializeThemeBridge(): void {
		this.themeBridge = new ThemeBridge((themeMode: ThemeMode): void => {
			const mappedTheme: CodeEditorTheme = this.mapModeToTheme(themeMode);
			this.updateGlobalConfigs({ theme: mappedTheme });
		});
	}

	private mapModeToTheme(themeMode: ThemeMode): CodeEditorTheme {
		const themeMap: Record<ThemeMode, CodeEditorTheme> = {
			light: CodeEditorTheme.LIGHT,
			dark: CodeEditorTheme.DARK
		};
		return themeMap[themeMode];
	}
}
