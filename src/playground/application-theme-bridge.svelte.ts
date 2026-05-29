// Bridges mode-watcher's reactive `mode` into a plain callback.
// Playground-only — outside src/lib/.

import { mode } from 'mode-watcher';

type ThemeMode = 'light' | 'dark';
type ThemeChangeCallback = (themeMode: ThemeMode) => void;
type EffectCleanup = () => void;

export class ThemeBridge {
	private stopEffect: EffectCleanup | null = null;

	constructor(private readonly onThemeChange: ThemeChangeCallback) {
		this.initializeEffect();
	}

	public dispose(): void {
		if (this.stopEffect !== null) {
			this.stopEffect();
			this.stopEffect = null;
		}
	}

	private initializeEffect(): void {
		this.stopEffect = $effect.root((): EffectCleanup => {
			$effect((): void => {
				const currentMode: ThemeMode | undefined = mode.current;
				if (currentMode !== undefined) {
					this.onThemeChange(currentMode);
				}
			});
			return (): void => {};
		});
	}
}
