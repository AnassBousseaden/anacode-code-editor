<script lang="ts">
	import { ScrollArea } from '$lib/ui-primitives/scroll-area/index';

	import {
		type FileTreeContextTarget,
		FileTreeContextTargetKind,
		type IFileTreeContextMenuViewModelV2
	} from '$lib/view-models/file-tree/context-menu/file-tree-context-menu-view-model-v2';
	import type { IFileTreeViewModel } from '$lib/view-models/file-tree/file-tree-view-model';
	import type { IFileIconFactory } from '$lib/view-models/file-tree/icons/file-icon-factory';

	import FileTreeContextMenu from '$lib/components/file-tree/FileTreeContextMenu.svelte';
	import FileTreeRow from '$lib/components/file-tree/FileTreeRow.svelte';

	interface Props {
		viewModel: IFileTreeViewModel;
		contextMenuViewModel: IFileTreeContextMenuViewModelV2;
		fileIconFactory: IFileIconFactory;
	}

	let { viewModel, contextMenuViewModel, fileIconFactory }: Props = $props();

	const itemsStore = $derived(viewModel.items);

	function handleContainerDragOver(event: DragEvent): void {
		event.preventDefault();
		viewModel.onDragOver(null);
	}

	async function handleContainerDrop(event: DragEvent): Promise<void> {
		event.preventDefault();
		await viewModel.onDrop();
	}

	function handleContextTargetChange(target: FileTreeContextTarget): void {
		switch (target.kind) {
			case FileTreeContextTargetKind.TARGETED: {
				viewModel.onRowClick(target.nodeID);
				return;
			}
			case FileTreeContextTargetKind.UNTARGETED: {
				return;
			}
		}
	}
</script>

<FileTreeContextMenu
	viewModel={contextMenuViewModel}
	onContextTargetChange={handleContextTargetChange}
>
	<ScrollArea class="h-full w-full">
		<div
			class="min-h-16 py-1.5"
			ondragover={handleContainerDragOver}
			ondrop={handleContainerDrop}
			role="tree"
			tabindex="0"
		>
			{#each $itemsStore as item (item.node.id)}
				<FileTreeRow viewModel={viewModel} item={item} fileIconFactory={fileIconFactory} />
			{/each}
		</div>
	</ScrollArea>
</FileTreeContextMenu>
