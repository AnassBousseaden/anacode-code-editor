<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils/cn.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { Button } from '$lib/ui-primitives/button/index.js';
	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';

	let {
		ref = $bindable(null),
		class: className,
		children,
		showCloseButton = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		showCloseButton?: boolean;
	} = $props();

	const messages: EditorMessages = getEditorMessages();
</script>

<div
	bind:this={ref}
	data-slot="dialog-footer"
	class={cn('gap-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
	{...restProps}
>
	{@render children?.()}
	{#if showCloseButton}
		<DialogPrimitive.Close>
			{#snippet child({ props })}
				<Button variant="outline" {...props}>{messages['common.close']}</Button>
			{/snippet}
		</DialogPrimitive.Close>
	{/if}
</div>
