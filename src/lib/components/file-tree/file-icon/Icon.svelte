<script lang="ts" module>
	import IconifyIcon, {addCollection} from '@iconify/svelte';
	import collection from '@iconify-json/vscode-icons/icons.json';

	addCollection(collection);
</script>

<script lang="ts">
	interface Props {
		icon: string;
		size?: number;
		class?: string;
	}

	let {icon, size = 16, class: className = ''}: Props = $props();
</script>

<IconifyIcon {icon} width={size} height={size} class={className} aria-hidden="true"/>
