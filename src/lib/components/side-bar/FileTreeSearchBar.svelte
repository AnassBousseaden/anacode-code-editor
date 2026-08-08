<script lang="ts">
	import { tick } from 'svelte';
	import type { Readable, Unsubscriber } from 'svelte/store';
	import { Search, X } from '@lucide/svelte';

	import {
		type FileTreeSearchKeyOutcome,
		FileTreeSearchKeyOutcomeKind,
		type FileTreeSearchPresentation,
		FileTreeSearchPresentationKind,
		type FileTreeSearchViewEvent,
		FileTreeSearchViewEventType,
		type IFileTreeSearchViewModel
	} from '$lib/view-models/file-tree/search/file-tree-search-view-model';

	interface Props {
		viewModel: IFileTreeSearchViewModel;
	}

	let { viewModel }: Props = $props();

	let inputElement: HTMLInputElement | undefined = $state(undefined);

	const presentationStore: Readable<FileTreeSearchPresentation> = $derived(viewModel.presentation);
	const presentation: FileTreeSearchPresentation = $derived($presentationStore);

	$effect((): Unsubscriber => {
		const unsubscriber: Unsubscriber = viewModel.onTransaction(
			(event: FileTreeSearchViewEvent): void => {
				switch (event.type) {
					case FileTreeSearchViewEventType.SEARCH_DID_REQUEST_FOCUS:
						void focusInput();
						return;
				}
			}
		);
		return unsubscriber;
	});

	// The field may be entering the DOM in this same flush; focus after it lands.
	async function focusInput(): Promise<void> {
		await tick();
		inputElement?.focus();
		inputElement?.select();
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }): void {
		viewModel.setQuery(event.currentTarget.value);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const outcome: FileTreeSearchKeyOutcome = viewModel.handleKey(event.key);
		if (outcome.kind === FileTreeSearchKeyOutcomeKind.HANDLED) {
			event.preventDefault();
		}
	}

	function handleDismiss(): void {
		viewModel.dismiss();
	}
</script>

{#if presentation.kind === FileTreeSearchPresentationKind.REVEALED}
	<div class="flex min-h-8 shrink-0 items-center gap-2 border-b border-sidebar-border px-2">
		<Search class="size-4 shrink-0 text-muted-foreground" />
		<input
			bind:this={inputElement}
			class="h-6 w-full bg-transparent text-[13px] text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none"
			oninput={handleInput}
			onkeydown={handleKeyDown}
			placeholder={presentation.placeholder}
			type="text"
			value={presentation.query}
		/>
		<button
			aria-label={presentation.dismissLabel}
			class="shrink-0 text-muted-foreground hover:text-sidebar-foreground"
			onclick={handleDismiss}
			type="button"
		>
			<X class="size-4" />
		</button>
	</div>
{/if}
