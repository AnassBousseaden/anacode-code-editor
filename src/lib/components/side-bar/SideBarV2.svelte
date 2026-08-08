<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';

	import ActionDialog from '$lib/components/dialog/ActionDialog.svelte';
	import FileTreeActionBar from '$lib/components/action-bar/FileTreeActionBar.svelte';
	import FileTreeSaveFooter from '$lib/components/side-bar/FileTreeSaveFooter.svelte';
	import FileTreeSearchBar from '$lib/components/side-bar/FileTreeSearchBar.svelte';
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
	import { FileTreeSearchViewModelImpl } from '$lib/view-models/file-tree/search/file-tree-search-view-model-impl';
	import type { IFileTreeSearchViewModel } from '$lib/view-models/file-tree/search/file-tree-search-view-model';

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
	const searchViewModel: IFileTreeSearchViewModel = new FileTreeSearchViewModelImpl(
		messages,
		fileTreeWorkspace.fileTreeSearchService,
		fileTreeWorkspace.fileTreeSearchService
	);
	const fileIconFactory: IFileIconFactory = createFileIconFactory();

	onDestroy((): void => {
		fileTreeViewModel.dispose();
		actionDialogViewModel.dispose();
		searchViewModel.dispose();
	});
</script>

<div class="flex h-full flex-col overflow-hidden">
	<FileTreeActionBar viewModel={actionBarViewModel} {onCollapseSidebar} />

	<FileTreeSearchBar viewModel={searchViewModel} />

	<div class="min-h-0 flex-1 overflow-hidden border-r border-sidebar-border">
		<FileTreeView
			viewModel={fileTreeViewModel}
			contextMenuViewModel={contextMenuViewModel}
			{fileIconFactory}
		/>
	</div>

	<FileTreeSaveFooter viewModel={actionBarViewModel} />

	{#if sidebarFooter}
		{@render sidebarFooter()}
	{/if}
</div>

<ActionDialog viewModel={actionDialogViewModel} />
