<script lang="ts">
	import { onDestroy } from 'svelte';
	import { MessageCircleWarning } from '@lucide/svelte';
	import type { Readable } from 'svelte/store';

	import { Button } from '$lib/ui-primitives/button';

	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
	import { EditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model-impl';
	import type { IEditorSession } from '$lib/core/session/editor-session';

	interface Props {
		session: IEditorSession;
	}

	let { session }: Props = $props();

	const viewModel: IEditorPromptStackViewModel = new EditorPromptStackViewModel(
		session.promptManager
	);

	let hiddenCountStore: Readable<number> = $derived(viewModel.hiddenCount);
	let hiddenCount: number = $derived($hiddenCountStore);

	onDestroy((): void => {
		viewModel.dispose();
	});
</script>

{#if hiddenCount > 0}
	<Button variant="ghost" size="xs" onclick={() => viewModel.showAll()}>
		<MessageCircleWarning class="size-3 text-muted-foreground" />
		{hiddenCount} hidden
	</Button>
{/if}
