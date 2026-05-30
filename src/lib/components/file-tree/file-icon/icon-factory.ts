import Icon from '$lib/components/file-tree/file-icon/Icon.svelte';

export type ThemeMode = 'light' | 'dark';

export interface ThemedIconID {
	readonly light: string;
	readonly dark: string;
}

export interface IconProps {
	icon: string;
	size?: number;
	class?: string;
}

export type IconComponent = typeof Icon;

export interface IIconFactory<TIconName extends string> {
	readonly component: IconComponent;

	getIconID(name: TIconName, theme: ThemeMode): string;

	getThemedIconID(name: TIconName): ThemedIconID;

	getAllIconNames(): ReadonlyArray<TIconName>;

	hasIcon(name: string): name is TIconName;
}
