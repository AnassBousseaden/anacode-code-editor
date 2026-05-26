<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Readable } from 'svelte/store';

	import ConflictResolutionPromptView from '$lib/components/editor-prompt/ConflictResolutionPromptView.svelte';
	import InvalidDocumentPromptView from '$lib/components/editor-prompt/InvalidDocumentPromptView.svelte';
	import NotificationPromptView from '$lib/components/editor-prompt/NotificationPromptView.svelte';
	import type { IEditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model';
	import { EditorPromptStackViewModel } from '$lib/view-models/editor-prompt/editor-prompt-stack-view-model-impl';
	import type { EditorPromptViewItem } from '$lib/view-models/editor-prompt/editor-prompt-view-state';
	import { EditorPromptViewItemKind } from '$lib/view-models/editor-prompt/editor-prompt-view-state';
	import type { IEditorSession } from '$lib/core/session/editor-session';

	interface Props {
		session: IEditorSession;
	}

	let { session }: Props = $props();

	const viewModel: IEditorPromptStackViewModel = new EditorPromptStackViewModel(
		session.promptManager
	);

	let promptsStore: Readable<ReadonlyArray<EditorPromptViewItem>> = $derived(
		viewModel.visiblePrompts
	);
	let prompts: ReadonlyArray<EditorPromptViewItem> = $derived($promptsStore);

	onDestroy((): void => {
		viewModel.dispose();
	});
</script>

<div
	class="pointer-events-none absolute bottom-0 right-0 top-0 z-10 flex flex-col-reverse gap-2 overflow-y-auto p-3"
>
	{#each prompts as item (item.id)}
		<div class="pointer-events-auto">
			{#if item.kind === EditorPromptViewItemKind.CONFLICT_RESOLUTION}
				<ConflictResolutionPromptView {item} {viewModel} />
			{:else if item.kind === EditorPromptViewItemKind.INVALID_DOCUMENT}
				<InvalidDocumentPromptView {item} {viewModel} />
			{:else if item.kind === EditorPromptViewItemKind.NOTIFICATION}
				<NotificationPromptView {item} {viewModel} />
			{/if}
		</div>
	{/each}
</div>
