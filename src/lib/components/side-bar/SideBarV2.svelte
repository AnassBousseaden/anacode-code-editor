<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';
	import { Search, X } from '@lucide/svelte';

	import ActionDialog from '$lib/components/dialog/ActionDialog.svelte';
	import FileTreeActionBar from '$lib/components/action-bar/FileTreeActionBar.svelte';
	import FileTreeView from '$lib/components/file-tree/FileTreeView.svelte';
	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';
	import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
	import type { IEditorNotificationPublisher } from '$lib/core/editor-prompt/editor-prompt-manager';
	import type { IFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';
	import type { IEditorFileTreeWorkspaceV2 } from '$lib/core/workspace/editor-workspace-v2';
	import type { IFileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';
	import { FileTreeActionErrorFactory } from '$lib/core/file-tree-v2/commands/file-system/impl/file-tree-action-error-factory-impl';
	import { FileTreeActionBarViewModelImpl } from '$lib/view-models/file-tree/action-bar/file-tree-action-bar-view-model-impl';
	import type { IFileTreeActionBarViewModel } from '$lib/view-models/file-tree/action-bar/file-tree-action-bar-view-model';
	import type { IFileTreeContextMenuViewModelV2 } from '$lib/view-models/file-tree/context-menu/file-tree-context-menu-view-model-v2';
	import { FileTreeContextMenuViewModelV2Impl } from '$lib/view-models/file-tree/context-menu/file-tree-context-menu-view-model-v2-impl';
	import { ActionDialogViewModelImpl } from '$lib/view-models/file-tree/dialog/action-dialog-view-model-impl';
	import type { IActionDialogViewModel } from '$lib/view-models/file-tree/dialog/action-dialog-view-model';
	import { FileTreeViewModelImpl } from '$lib/view-models/file-tree/file-tree-view-model-impl';
	import type { IFileTreeViewModel } from '$lib/view-models/file-tree/file-tree-view-model';
	import {
		createFileIconFactory,
		type IFileIconFactory
	} from '$lib/view-models/file-tree/icons/file-icon-factory';

	interface Props {
		fileTreeWorkspace: IEditorFileTreeWorkspaceV2;
		selectionIntent: IFileTreeSelectionIntent;
		intentCommands: IEditorIntentCommands;
		notificationPublisher: IEditorNotificationPublisher;
		onCollapseSidebar: () => void;
		sidebarFooter?: Snippet;
	}

	let {
		fileTreeWorkspace,
		selectionIntent,
		intentCommands,
		notificationPublisher,
		onCollapseSidebar,
		sidebarFooter
	}: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	const actionErrorFactory: IFileTreeActionErrorFactory = new FileTreeActionErrorFactory();
	const actionDialogViewModel: IActionDialogViewModel = new ActionDialogViewModelImpl(
		fileTreeWorkspace.commandRegistry
	);
	const actionBarViewModel: IFileTreeActionBarViewModel = new FileTreeActionBarViewModelImpl(
		messages,
		fileTreeWorkspace.commandRegistry,
		actionDialogViewModel,
		notificationPublisher
	);
	const contextMenuViewModel: IFileTreeContextMenuViewModelV2 =
		new FileTreeContextMenuViewModelV2Impl(
			messages,
			fileTreeWorkspace.commandRegistry,
			actionErrorFactory,
			actionDialogViewModel,
			notificationPublisher
		);
	const fileTreeViewModel: IFileTreeViewModel = new FileTreeViewModelImpl(
		fileTreeWorkspace.fileTree,
		fileTreeWorkspace.fileTreeProjection,
		selectionIntent,
		intentCommands,
		fileTreeWorkspace.fileTreeDragController,
		fileTreeWorkspace.commandRegistry
	);
	const fileIconFactory: IFileIconFactory = createFileIconFactory();

	const searchQueryStore = $derived(fileTreeWorkspace.fileTreeSearchService.searchQuery);
	const searchQuery: string = $derived($searchQueryStore);

	function handleSearchInput(event: Event): void {
		const input: HTMLInputElement = event.currentTarget as HTMLInputElement;
		fileTreeWorkspace.fileTreeSearchService.setSearchQuery(input.value);
	}

	function clearSearch(): void {
		fileTreeWorkspace.fileTreeSearchService.setSearchQuery('');
	}

	onDestroy((): void => {
		fileTreeViewModel.dispose();
		actionDialogViewModel.dispose();
	});
</script>

<div class="flex h-full flex-col overflow-hidden">
	<FileTreeActionBar viewModel={actionBarViewModel} {onCollapseSidebar} />

	<div class="flex min-h-8 shrink-0 items-center gap-2 border-b border-border/30 px-2">
		<Search class="size-4 shrink-0 text-muted-foreground" />
		<input
			class="h-6 w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
			oninput={handleSearchInput}
			placeholder={messages.sideBarSearchPlaceholder}
			type="text"
			value={searchQuery}
		/>
		{#if searchQuery !== ''}
			<button
				class="shrink-0 text-muted-foreground hover:text-foreground"
				onclick={clearSearch}
				type="button"
			>
				<X class="size-4" />
			</button>
		{/if}
	</div>

	<div class="min-h-0 flex-1 overflow-hidden border-r border-border/30">
		<FileTreeView
			viewModel={fileTreeViewModel}
			contextMenuViewModel={contextMenuViewModel}
			{fileIconFactory}
		/>
	</div>

	{#if sidebarFooter}
		{@render sidebarFooter()}
	{/if}
</div>

<ActionDialog viewModel={actionDialogViewModel} />
