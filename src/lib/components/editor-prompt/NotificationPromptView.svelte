<script lang="ts">
	import { CircleAlert, Info, OctagonAlert, X } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import { Button } from '$lib/ui-primitives/button';

	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
	import type {
		NotificationPromptViewItem,
		PromptActionViewItem
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';
	import {
		NotificationPromptViewItemToneKind,
		PromptActionState
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';

	interface Props {
		item: NotificationPromptViewItem;
		viewModel: IEditorPromptStackViewModel;
	}

	let { item, viewModel }: Props = $props();

	function dispatch(entry: PromptActionViewItem): void {
		viewModel.perform(entry.promptID, entry.action);
	}

	let IconComponent: Component = $derived.by((): Component => {
		switch (item.tone) {
			case NotificationPromptViewItemToneKind.INFO:
				return Info;
			case NotificationPromptViewItemToneKind.WARNING:
				return CircleAlert;
			case NotificationPromptViewItemToneKind.ERROR:
				return OctagonAlert;
		}
	});
</script>

<div
	class="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-sm"
>
	<IconComponent class="size-5 text-muted-foreground" />
	<div class="min-w-0 flex-1">
		<span class="font-medium text-foreground">{item.title}</span>
		<span class="text-muted-foreground"> — {item.content}</span>
	</div>
	<Button
		variant="ghost"
		size="icon-xs"
		disabled={item.dismiss.state !== PromptActionState.ENABLED}
		onclick={() => dispatch(item.dismiss)}
	>
		<X />
	</Button>
</div>
