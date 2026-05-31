<script lang="ts">
	import Icon from '$lib/components/file-tree/file-icon/Icon.svelte';
	import type { ThemedIconID } from '$lib/components/file-tree/file-icon/icon-factory';
	import { cn } from '$lib/utils/cn';

	interface Props {
		themed: ThemedIconID;
		size?: number;
		class?: string;
	}

	let { themed, size = 16, class: className = '' }: Props = $props();
</script>

<!--
	Renders both the light and dark icon and lets the `.dark` class decide which
	is visible — the same CSS-only swap the theme toggle uses. Keeps this library
	free of any runtime read of the active mode (no mode-watcher import).
-->
<Icon icon={themed.light} {size} class={cn('dark:hidden', className)} />
<Icon icon={themed.dark} {size} class={cn('hidden dark:block', className)} />
