<script lang="ts">
	import { CircleAlert, CircleDot, Lock, X } from '@lucide/svelte';

	import ThemedIcon from '$lib/components/file-tree/file-icon/ThemedIcon.svelte';
	import type { ThemedIconID } from '$lib/components/file-tree/file-icon/icon-factory';
	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';
	import { SaveEntryKind } from '$lib/core/editor/save/registry/draft-registry';
	import {
		type OpenTabSnapshot,
		TabSaveStatusKind
	} from '$lib/core/tab-bar/tab-projection-models';
	import {
		createFileIconFactory,
		type IFileIconFactory
	} from '$lib/view-models/file-tree/icons/file-icon-factory';
	import type { ITabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2';
	import { cn } from '$lib/utils/cn';

	interface Props {
		viewModel: ITabBarViewModelV2;
		tabEntry: OpenTabSnapshot;
	}

	let { viewModel, tabEntry }: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	const fileIconFactory: IFileIconFactory = createFileIconFactory();

	let isHovered = $state(false);

	const iconID: ThemedIconID = $derived(fileIconFactory.getThemedIconIDByFileName(tabEntry.name));

	function handleClick(): void {
		viewModel.selectTab(tabEntry.nodeID);
	}

	function handleClose(event: MouseEvent): void {
		event.stopPropagation();
		viewModel.closeTab(tabEntry.nodeID);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}

	function handleCloseKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			viewModel.closeTab(tabEntry.nodeID);
		}
	}
</script>

<div
	aria-selected={tabEntry.isActive}
	class={cn(
		'group relative flex h-full items-center rounded-t-lg',
		'transition-all duration-150 ease-out',
		tabEntry.isActive
			? 'bg-background text-foreground shadow-sm'
			: 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
	)}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="tab"
	tabindex={tabEntry.isActive ? 0 : -1}
>
	<button
		class="flex h-full items-center gap-2 px-3 text-[13px] font-medium"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		title={tabEntry.name}
	>
		<ThemedIcon class="shrink-0 opacity-80" size={18} themed={iconID} />
		<span class="max-w-32 truncate">{tabEntry.name}</span>
		{#if tabEntry.isReadOnly}
			<Lock class="size-3 shrink-0 text-muted-foreground/60" />
		{/if}
	</button>

	{#if tabEntry.saveStatus.kind === TabSaveStatusKind.DIRTY}
		{#if tabEntry.saveStatus.entryKind === SaveEntryKind.SAVEABLE}
			<span class="ml-1 mr-2 flex shrink-0 items-center" title={messages.commonStatusUnsaved}>
				<CircleDot class="size-4 text-foreground" />
			</span>
		{:else if tabEntry.saveStatus.entryKind === SaveEntryKind.CONFLICTED}
			<span
				class="ml-1 mr-2 flex shrink-0 items-center"
				title={messages.commonStatusConflicted}
			>
				<CircleAlert class="size-4 text-primary" />
			</span>
		{:else if tabEntry.saveStatus.entryKind === SaveEntryKind.INVALID}
			<span class="ml-1 mr-2 flex shrink-0 items-center" title={messages.commonStatusInvalid}>
				<CircleAlert class="size-4 text-destructive" />
			</span>
		{/if}
	{/if}

	<button
		aria-label={messages.tabCloseAriaLabel({ name: tabEntry.name })}
		class={cn(
			'mr-2 flex size-5 items-center justify-center rounded-md',
			'transition-all duration-150 ease-out',
			isHovered || tabEntry.isActive
				? 'opacity-100 hover:bg-foreground/10'
				: 'pointer-events-none opacity-0'
		)}
		onclick={handleClose}
		onkeydown={handleCloseKeyDown}
		tabindex={isHovered || tabEntry.isActive ? 0 : -1}
		title={messages.commonClose}
	>
		<X class="size-3.5" />
	</button>

	{#if tabEntry.isActive}
		<div class="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-primary"></div>
	{/if}
</div>
