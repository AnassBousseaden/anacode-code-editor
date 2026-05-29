<script lang="ts" module>
	import collection from '@iconify-json/vscode-icons/icons.json';

	const icons = collection.icons as Record<string, { body: string }>;
</script>

<script lang="ts">
	interface Props {
		icon: string;
		size?: number;
		class?: string;
	}

	let { icon, size = 16, class: className = '' }: Props = $props();

	// `icon` is `vscode-icons:<name>` — look up the body by the part after the colon.
	const body: string = $derived(icons[icon.split(':').pop() ?? '']?.body ?? '');
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 {collection.width} {collection.height}"
	aria-hidden="true"
>{@html body}</svg>
