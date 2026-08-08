<script lang="ts">
	import { MessageCircleWarning } from '@lucide/svelte';
	import type { Readable } from 'svelte/store';

	import { Button } from '$lib/ui-primitives/button';

	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';
	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';

	interface Props {
		viewModel: IEditorPromptStackViewModel;
	}

	let { viewModel }: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	const hiddenCountStore: Readable<number> = $derived(viewModel.hiddenCount);
	const hiddenCount: number = $derived($hiddenCountStore);
</script>

{#if hiddenCount > 0}
	<Button
		class="pointer-events-auto"
		onclick={() => viewModel.showAll()}
		size="xs"
		variant="secondary"
	>
		<MessageCircleWarning class="text-muted-foreground" />
		{messages.promptStackHiddenCount({ count: hiddenCount })}
	</Button>
{/if}
