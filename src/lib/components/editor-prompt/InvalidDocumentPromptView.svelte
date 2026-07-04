<script lang="ts">
	import { LoaderCircle, Shredder, X } from '@lucide/svelte';

	import { Button } from '$lib/ui-primitives/button';
	import {
		Card,
		CardContent,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/ui-primitives/card';

	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';
	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
	import type {
		InvalidDocumentPromptViewItem,
		PromptActionViewItem
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';
	import {
		InvalidDocumentPromptViewItemStateKind,
		PromptActionState
	} from '$lib/view-models/editor-prompt/editor-prompt-view-state';

	interface Props {
		item: InvalidDocumentPromptViewItem;
		viewModel: IEditorPromptStackViewModel;
	}

	let { item, viewModel }: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	function dispatch(entry: PromptActionViewItem): void {
		viewModel.perform(entry.promptID, entry.action);
	}
</script>

<Card size="sm" class="min-w-[350px] gap-1 py-2">
	<CardHeader class="px-2.5">
		<CardTitle class="flex items-center gap-2 text-nowrap text-xs">
			<Shredder class="size-5 text-muted-foreground" />
			{messages.promptInvalidDocTitle}
		</CardTitle>
	</CardHeader>
	<CardContent class="px-2.5 text-xs text-muted-foreground">
		<p>{messages.promptInvalidDocBody({ fileName: item.fileName })}</p>
		{#if item.state === InvalidDocumentPromptViewItemStateKind.FAILED}
			<p class="mt-1 text-destructive">{item.errorMessage}</p>
		{/if}
	</CardContent>
	<CardFooter class="gap-1.5 px-2.5">
		{#if item.state === InvalidDocumentPromptViewItemStateKind.FAILED}
			<Button
				size="xs"
				class="flex-1 justify-center"
				disabled={item.retry.state !== PromptActionState.ENABLED}
				onclick={() => dispatch(item.retry)}
			>
				{#if item.retry.state === PromptActionState.LOADING}
					<LoaderCircle class="animate-spin" />
				{/if}
				{messages.commonRetry}
			</Button>
		{:else}
			<Button
				size="xs"
				class="flex-1 justify-center"
				disabled={item.close.state !== PromptActionState.ENABLED}
				onclick={() => dispatch(item.close)}
			>
				{#if item.close.state === PromptActionState.LOADING}
					<LoaderCircle class="animate-spin" />
				{/if}
				{messages.promptInvalidDocClose}
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
