<script lang="ts">
	import IconifyIcon from '@iconify/svelte';

	interface Props {
		icon: string;
		size?: number;
		class?: string;
	}

	let { icon, size = 16, class: className = '' }: Props = $props();
</script>

<span
	class="inline-flex items-center justify-center {className}"
	style:height="{size}px"
	style:width="{size}px"
>
	<IconifyIcon {icon} width={size} height={size} />
</span>
