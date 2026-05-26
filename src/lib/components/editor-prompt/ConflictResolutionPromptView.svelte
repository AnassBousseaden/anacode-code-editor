<script lang="ts">
	import { LoaderCircle, MessageCircleWarning, X } from '@lucide/svelte';

	import { Button } from '$lib/ui-primitives/button';
	import {
		Card,
		CardContent,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/ui-primitives/card';

	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
	import type {
		ConflictResolutionPromptViewItem,
		PromptActionViewItem
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';
	import {
		ConflictPromptViewItemStateKind,
		PromptActionState
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';

	interface Props {
		item: ConflictResolutionPromptViewItem;
		viewModel: IEditorPromptStackViewModel;
	}

	let { item, viewModel }: Props = $props();

	function dispatch(entry: PromptActionViewItem): void {
		viewModel.perform(entry.promptID, entry.action);
	}
</script>

<Card size="sm" class="min-w-[350px] gap-1 py-2">
	<CardHeader class="px-2.5">
		<CardTitle class="flex items-center gap-2 text-xs">
			<MessageCircleWarning class="size-5 text-muted-foreground" />
			File changed on disk
		</CardTitle>
	</CardHeader>
	<CardContent class="px-2.5 text-xs text-muted-foreground">
		<p>
			<span class="font-medium text-foreground">{item.fileName}</span> changed on disk since you opened
			it.
		</p>
		{#if item.state === ConflictPromptViewItemStateKind.FAILED}
			<p class="mt-1 text-destructive">{item.errorMessage}</p>
		{/if}
	</CardContent>
	<CardFooter class="gap-1.5 px-2.5">
		{#if item.state === ConflictPromptViewItemStateKind.FAILED}
			<Button
				size="xs"
				class="flex-1 justify-center"
				disabled={item.retry.state !== PromptActionState.ENABLED}
				onclick={() => dispatch(item.retry)}
			>
				{#if item.retry.state === PromptActionState.LOADING}
					<LoaderCircle class="animate-spin" />
				{/if}
				Retry
			</Button>
		{:else}
			<Button
				size="xs"
				variant="outline"
				class="flex-1 justify-center"
				disabled={item.reload.state !== PromptActionState.ENABLED}
				onclick={() => dispatch(item.reload)}
			>
				{#if item.reload.state === PromptActionState.LOADING}
					<LoaderCircle class="animate-spin" />
				{/if}
				Reload from disk
			</Button>
			<Button
				size="xs"
				class="flex-1 justify-center"
				disabled={item.overwrite.state !== PromptActionState.ENABLED}
				onclick={() => dispatch(item.overwrite)}
			>
				{#if item.overwrite.state === PromptActionState.LOADING}
					<LoaderCircle class="animate-spin" />
				{/if}
				Overwrite disk
			</Button>
		{/if}
		<Button
			variant="ghost"
			size="icon-xs"
			disabled={item.dismiss.state !== PromptActionState.ENABLED}
			onclick={() => dispatch(item.dismiss)}
		>
			<X />
		</Button>
	</CardFooter>
</Card>
