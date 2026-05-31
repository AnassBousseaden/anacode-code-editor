<script lang="ts">
	import { ClipboardCopy, Pen, Plus, Trash2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	import {
		ContextMenu,
		ContextMenuContent,
		ContextMenuItem,
		ContextMenuSeparator,
		ContextMenuSub,
		ContextMenuSubContent,
		ContextMenuSubTrigger,
		ContextMenuTrigger
	} from '$lib/ui-primitives/context-menu/index';

	import ThemedIcon from '$lib/components/file-tree/file-icon/ThemedIcon.svelte';
	import type { ThemedIconID } from '$lib/components/file-tree/file-icon/icon-factory';
	import {
		FILE_TREE_NODE_ID_ATTRIBUTE,
		FILE_TREE_NODE_ID_SELECTOR
	} from '$lib/components/file-tree/file-tree-data-attributes';
	import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
	import {
		AvailableFileTreeContextMenuActionKind,
		type CopyPathContextMenuActionItem,
		FileTreeContextMenuActionAvailabilityKind,
		type FileTreeContextMenuActionItem,
		FileTreeContextMenuActionKind,
		type FileTreeContextMenuCapabilities,
		type FileTreeContextTarget,
		FileTreeContextTargetKind,
		type IFileTreeContextMenuViewModelV2,
		type TargetedFileTreeContextTarget,
		type UntargetedFileTreeContextTarget
	} from '$lib/view-models/file-tree/context-menu/file-tree-context-menu-view-model-v2';
	import {
		createFileIconFactory,
		type IFileIconFactory
	} from '$lib/view-models/file-tree/icons/file-icon-factory';

	interface Props {
		viewModel: IFileTreeContextMenuViewModelV2;
		onContextTargetChange?: (target: FileTreeContextTarget) => void;
		children: Snippet;
	}

	let { viewModel, onContextTargetChange, children }: Props = $props();

	const fileIconFactory: IFileIconFactory = createFileIconFactory();
	const fileIconID: ThemedIconID = $derived(fileIconFactory.getThemedDefaultIconID());
	const folderIconID: ThemedIconID = $derived(fileIconFactory.getThemedFolderIconID(false));

	const EMPTY_CAPABILITIES: FileTreeContextMenuCapabilities = { actions: [] };

	let capabilities: FileTreeContextMenuCapabilities = $state(EMPTY_CAPABILITIES);

	const createFile: FileTreeContextMenuActionItem | undefined = $derived(
		findAction(FileTreeContextMenuActionKind.CREATE_FILE)
	);
	const createFolder: FileTreeContextMenuActionItem | undefined = $derived(
		findAction(FileTreeContextMenuActionKind.CREATE_FOLDER)
	);
	const rename: FileTreeContextMenuActionItem | undefined = $derived(
		findAction(FileTreeContextMenuActionKind.RENAME)
	);
	const deleteAction: FileTreeContextMenuActionItem | undefined = $derived(
		findAction(FileTreeContextMenuActionKind.DELETE)
	);
	const copyPath: FileTreeContextMenuActionItem | undefined = $derived(
		findAction(FileTreeContextMenuActionKind.COPY_PATH)
	);

	const isCreateFileEnabled: boolean = $derived(isItemAvailable(createFile));
	const isCreateFolderEnabled: boolean = $derived(isItemAvailable(createFolder));
	const isCreateEnabled: boolean = $derived(isCreateFileEnabled || isCreateFolderEnabled);
	const isRenameEnabled: boolean = $derived(isItemAvailable(rename));
	const isDeleteEnabled: boolean = $derived(isItemAvailable(deleteAction));
	const isCopyPathEnabled: boolean = $derived(isItemAvailable(copyPath));

	function buildUntargetedTarget(): UntargetedFileTreeContextTarget {
		const untargeted: UntargetedFileTreeContextTarget = {
			kind: FileTreeContextTargetKind.UNTARGETED
		};
		return untargeted;
	}

	function buildTargetedTarget(nodeID: NodeID): TargetedFileTreeContextTarget {
		const targeted: TargetedFileTreeContextTarget = {
			kind: FileTreeContextTargetKind.TARGETED,
			nodeID: nodeID
		};
		return targeted;
	}

	function resolveTarget(event: MouseEvent): FileTreeContextTarget {
		const eventTarget: EventTarget | null = event.target;
		if (eventTarget === null) {
			return buildUntargetedTarget();
		}
		if (!(eventTarget instanceof Element)) {
			return buildUntargetedTarget();
		}
		const row: Element | null = eventTarget.closest(FILE_TREE_NODE_ID_SELECTOR);
		if (row === null) {
			return buildUntargetedTarget();
		}
		const rawNodeID: string | null = row.getAttribute(FILE_TREE_NODE_ID_ATTRIBUTE);
		if (rawNodeID === null) {
			return buildUntargetedTarget();
		}
		const parsedNodeID: number = Number(rawNodeID);
		if (Number.isNaN(parsedNodeID)) {
			return buildUntargetedTarget();
		}
		const nodeID: NodeID = parsedNodeID as NodeID;
		return buildTargetedTarget(nodeID);
	}

	function handleTrigger(event: MouseEvent): void {
		const target: FileTreeContextTarget = resolveTarget(event);
		capabilities = viewModel.capabilitiesFor(target);
		if (onContextTargetChange !== undefined) {
			onContextTargetChange(target);
		}
	}

	function findAction(
		kind: FileTreeContextMenuActionKind
	): FileTreeContextMenuActionItem | undefined {
		const found: FileTreeContextMenuActionItem | undefined = capabilities.actions.find(
			(action: FileTreeContextMenuActionItem): boolean => action.kind === kind
		);
		return found;
	}

	function isItemAvailable(item: FileTreeContextMenuActionItem | undefined): boolean {
		if (item === undefined) {
			return false;
		}
		const isAvailable: boolean =
			item.availability.kind === FileTreeContextMenuActionAvailabilityKind.AVAILABLE;
		return isAvailable;
	}

	function invoke(item: FileTreeContextMenuActionItem | undefined): void {
		if (item === undefined) {
			return;
		}
		if (item.availability.kind !== FileTreeContextMenuActionAvailabilityKind.AVAILABLE) {
			return;
		}
		if (item.availability.availableKind !== AvailableFileTreeContextMenuActionKind.PERFORM) {
			return;
		}
		item.availability.perform();
	}

	async function handleCopyPath(): Promise<void> {
		if (copyPath === undefined) {
			return;
		}
		if (copyPath.kind !== FileTreeContextMenuActionKind.COPY_PATH) {
			return;
		}
		const copyPathItem: CopyPathContextMenuActionItem = copyPath;
		if (copyPathItem.availability.kind !== FileTreeContextMenuActionAvailabilityKind.AVAILABLE) {
			return;
		}
		if (
			copyPathItem.availability.availableKind !== AvailableFileTreeContextMenuActionKind.DELIVER
		) {
			return;
		}
		await copyPathItem.availability.deliver();
	}

	function handleCreateFile(): void {
		invoke(createFile);
	}

	function handleCreateFolder(): void {
		invoke(createFolder);
	}

	function handleRename(): void {
		invoke(rename);
	}

	function handleDelete(): void {
		invoke(deleteAction);
	}
</script>

<ContextMenu>
	<ContextMenuTrigger class="h-full w-full" oncontextmenu={handleTrigger}>
		{@render children()}
	</ContextMenuTrigger>
	<ContextMenuContent class="min-w-44">
		<ContextMenuSub>
			<ContextMenuSubTrigger disabled={!isCreateEnabled} class="gap-2">
				<Plus class="size-4 text-muted-foreground" />
				<span>New</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent class="min-w-36">
				<ContextMenuItem
					class="gap-2"
					disabled={!isCreateFileEnabled}
					onclick={handleCreateFile}
				>
					<ThemedIcon size={16} themed={fileIconID} />
					<span>File</span>
				</ContextMenuItem>
				<ContextMenuItem
					class="gap-2"
					disabled={!isCreateFolderEnabled}
					onclick={handleCreateFolder}
				>
					<ThemedIcon size={16} themed={folderIconID} />
					<span>Folder</span>
				</ContextMenuItem>
			</ContextMenuSubContent>
		</ContextMenuSub>

		<ContextMenuSeparator class="my-1" />

		<ContextMenuItem class="gap-2" disabled={!isRenameEnabled} onclick={handleRename}>
			<Pen class="size-4 text-muted-foreground" />
			<span>Rename</span>
		</ContextMenuItem>

		<ContextMenuSeparator class="my-1" />

		<ContextMenuItem
			class="gap-2"
			disabled={!isDeleteEnabled}
			onclick={handleDelete}
			variant="destructive"
		>
			<Trash2 class="size-4 text-destructive" />
			<span>Delete</span>
		</ContextMenuItem>

		<ContextMenuSeparator class="my-1" />

		<ContextMenuItem class="gap-2" disabled={!isCopyPathEnabled} onclick={handleCopyPath}>
			<ClipboardCopy class="size-4 text-muted-foreground" />
			<span>Copy path</span>
		</ContextMenuItem>
	</ContextMenuContent>
</ContextMenu>
