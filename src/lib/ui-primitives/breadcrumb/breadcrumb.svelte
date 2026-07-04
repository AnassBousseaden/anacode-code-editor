<script lang="ts">
	import type { WithElementRef } from '$lib/utils/cn.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn.js';
	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();

	const messages: EditorMessages = getEditorMessages();
</script>

<nav
	bind:this={ref}
	data-slot="breadcrumb"
	aria-label={messages.breadcrumbAriaLabel}
	class={cn('cn-breadcrumb', className)}
	{...restProps}
>
	{@render children?.()}
</nav>
