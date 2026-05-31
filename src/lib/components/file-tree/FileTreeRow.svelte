<script lang="ts">
	import { ChevronRight, CircleDot, CircleAlert } from '@lucide/svelte';

	import { cn } from '$lib/utils/cn';
	import ThemedIcon from '$lib/components/file-tree/file-icon/ThemedIcon.svelte';
	import type { IFileIconFactory } from '$lib/view-models/file-tree/icons/file-icon-factory';
	import type { ThemedIconID } from '$lib/components/file-tree/file-icon/icon-factory';

	import {
		type DragStartOutcome,
		DragStartOutcomeKind
	} from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
	import type { IFileTreeViewModel } from '$lib/view-models/file-tree/file-tree-view-model';
	import {
		FileSaveStatus,
		type FileTreeItem
	} from '$lib/core/file-tree-v2/projection/file-tree-projection';
	import { NodeType } from '$lib/core/file-system/domain/file-system-models';
	import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
	import { FILE_TREE_NODE_ID_ATTRIBUTE } from '$lib/components/file-tree/file-tree-data-attributes';

	interface Props {
		viewModel: IFileTreeViewModel;
		item: FileTreeItem;
		fileIconFactory: IFileIconFactory;
	}

	let { viewModel, item, fileIconFactory }: Props = $props();

	const isExpanded: boolean = $derived(item.type === NodeType.FOLDER ? item.isExpanded : false);
	const isActive: boolean = $derived(item.type === NodeType.FILE ? item.isActive : false);
	const saveStatus: FileSaveStatus = $derived(
		item.type === NodeType.FILE ? item.saveStatus : FileSaveStatus.CLEAN
	);

	const isDraggable: boolean = $derived(
		!item.isForeignUserSpace && item.node.parentID !== null && item.node.permissions.write
	);

	const nodeIconID: ThemedIconID = $derived(
		item.type === NodeType.FOLDER
			? fileIconFactory.getThemedFolderIconID(item.isExpanded)
			: fileIconFactory.getThemedIconIDByFileName(item.node.name)
	);

	const filenameColorClass: string = $derived(
		item.isForeignUserSpace
			? 'text-foreign-foreground'
			: isActive
				? 'font-medium text-foreground'
				: 'text-muted-foreground'
	);

	const nodeIDAttribute: Record<string, NodeID> = $derived({
		[FILE_TREE_NODE_ID_ATTRIBUTE]: item.node.id
	});

	function handleTwistyClick(event: MouseEvent): void {
		event.stopPropagation();
		viewModel.onTwistyClick(item.node.id as NodeID);
	}

	function handleClick(): void {
		viewModel.onRowClick(item.node.id as NodeID);
	}

	function handleDoubleClick(): void {
		viewModel.onRowDoubleClick(item.node.id as NodeID);
	}

	function handleDragStart(event: DragEvent): void {
		const outcome: DragStartOutcome = viewModel.onDragStart(item.node.id as NodeID);
		if (outcome.kind === DragStartOutcomeKind.REJECTED) {
			event.preventDefault();
			return;
		}
		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		viewModel.onDragOver(item.node.id as NodeID);
	}

	async function handleDrop(event: DragEvent): Promise<void> {
		event.preventDefault();
		event.stopPropagation();
		await viewModel.onDrop();
	}

	function handleDragEnd(): void {
		viewModel.onDragEnd();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
	{...nodeIDAttribute}
	aria-expanded={item.type === NodeType.FOLDER ? item.isExpanded : undefined}
	aria-selected={item.isSelected}
	class={cn(
		'group relative flex w-full min-h-8 items-center gap-2 text-left text-[13px] transition-colors duration-100',
		'hover:bg-accent',
		item.isSelected && 'bg-accent',
		isActive && 'bg-accent',
		item.isDragged && 'opacity-50',
		item.isDropTarget && 'bg-info',
		item.isInvalidDropTarget && 'cursor-no-drop'
	)}
	draggable={isDraggable}
	onclick={handleClick}
	ondblclick={handleDoubleClick}
	ondragend={handleDragEnd}
	ondragover={handleDragOver}
	ondragstart={handleDragStart}
	ondrop={handleDrop}
	role="treeitem"
	style={`padding-left: calc(${item.depth} * 1.5rem + 0.5rem)`}
	tabindex="-1"
>
	{#if isActive}
		<div class="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-primary"></div>
	{/if}

	{#if item.type === NodeType.FOLDER}
		<button
			class="flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-foreground/10"
			onclick={handleTwistyClick}
		>
			<ChevronRight
				class={cn(
					'size-4 text-muted-foreground transition-transform duration-150',
					isExpanded && 'rotate-90'
				)}
			/>
		</button>
	{:else}
		<span class="size-4 shrink-0"></span>
	{/if}

	<ThemedIcon
		class={cn('shrink-0', item.isForeignUserSpace ? 'opacity-50' : 'opacity-80')}
		size={18}
		themed={nodeIconID}
	/>

	<span class={cn('truncate', filenameColorClass)}>{item.node.name}</span>

	{#if item.type === NodeType.FILE}
		{#if saveStatus === FileSaveStatus.SAVEABLE}
			<span class="ml-auto mr-2 flex shrink-0 items-center" title="Unsaved">
				<CircleDot class="size-4 text-foreground" />
			</span>
		{:else if saveStatus === FileSaveStatus.CONFLICTED}
			<span class="ml-auto mr-2 flex shrink-0 items-center" title="Conflicted">
				<CircleAlert class="size-4 text-primary" />
			</span>
		{:else if saveStatus === FileSaveStatus.INVALID}
			<span class="ml-auto mr-2 flex shrink-0 items-center" title="Invalid">
				<CircleAlert class="size-4 text-destructive" />
			</span>
		{/if}
	{/if}
</div>
