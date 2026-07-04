<script lang="ts">
	import {
		ChevronsDownUp,
		ChevronsUpDown,
		Crosshair,
		FolderPlus,
		PanelLeftClose,
		Pen,
		Plus,
		SaveAll,
		Trash2
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { Readable } from 'svelte/store';

	import { buttonVariants } from '$lib/ui-primitives/button';
	import {
		Content as DropdownMenuContent,
		Item as DropdownMenuItem,
		Root as DropdownMenuRoot,
		Trigger as DropdownMenuTrigger
	} from '$lib/ui-primitives/dropdown-menu/index';
	import {
		Content as TooltipContent,
		Provider as TooltipProvider,
		Root as TooltipRoot,
		Trigger as TooltipTrigger
	} from '$lib/ui-primitives/tooltip/index';

	import ThemedIcon from '$lib/components/file-tree/file-icon/ThemedIcon.svelte';
	import type { ThemedIconID } from '$lib/components/file-tree/file-icon/icon-factory';
	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';

	import {
		type CollapseNodeUICommandPresentation,
		type CreateFileActionBarPresentation,
		type CreateFolderActionBarPresentation,
		type DeleteActionBarPresentation,
		type ExpandNodeUICommandPresentation,
		FileTreeActionAvailabilityKind,
		type FileTreeActionBarPresentation,
		type FileTreeActionIcon,
		FileTreeActionIconKind,
		type IFileTreeActionBarViewModel,
		type LocateActiveFileUICommandPresentation,
		type RenameActionBarPresentation,
		type SaveAllSaveCommandPresentation
	} from '$lib/view-models/file-tree/action-bar/file-tree-action-bar-view-model';
	import {
		createFileIconFactory,
		type IFileIconFactory
	} from '$lib/view-models/file-tree/icons/file-icon-factory';

	interface Props {
		viewModel: IFileTreeActionBarViewModel;
		onCollapseSidebar: () => void;
	}

	let { viewModel, onCollapseSidebar }: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	const FALLBACK_ICON: Component = Plus;
	const ACTION_ICON_REGISTRY: Record<string, Component> = {
		plus: Plus,
		'folder-plus': FolderPlus,
		pen: Pen,
		trash: Trash2
	};

	const fileIconFactory: IFileIconFactory = createFileIconFactory();
	const fileIconID: ThemedIconID = $derived(fileIconFactory.getThemedDefaultIconID());
	const folderIconID: ThemedIconID = $derived(fileIconFactory.getThemedFolderIconID(false));

	const createFileStore: Readable<CreateFileActionBarPresentation> = $derived(viewModel.createFile);
	const createFolderStore: Readable<CreateFolderActionBarPresentation> = $derived(
		viewModel.createFolder
	);
	const renameStore: Readable<RenameActionBarPresentation> = $derived(viewModel.rename);
	const deleteStore: Readable<DeleteActionBarPresentation> = $derived(viewModel.delete);
	const expandNodeStore: Readable<ExpandNodeUICommandPresentation> = $derived(viewModel.expandNode);
	const collapseNodeStore: Readable<CollapseNodeUICommandPresentation> = $derived(
		viewModel.collapseNode
	);
	const locateActiveFileStore: Readable<LocateActiveFileUICommandPresentation> = $derived(
		viewModel.locateActiveFile
	);
	const saveAllStore: Readable<SaveAllSaveCommandPresentation> = $derived(viewModel.saveAll);

	const createFile: CreateFileActionBarPresentation = $derived($createFileStore);
	const createFolder: CreateFolderActionBarPresentation = $derived($createFolderStore);
	const rename: RenameActionBarPresentation = $derived($renameStore);
	const deletePresentation: DeleteActionBarPresentation = $derived($deleteStore);
	const expandNodePresentation: ExpandNodeUICommandPresentation = $derived($expandNodeStore);
	const collapseNodePresentation: CollapseNodeUICommandPresentation = $derived($collapseNodeStore);
	const locateActiveFilePresentation: LocateActiveFileUICommandPresentation = $derived(
		$locateActiveFileStore
	);
	const saveAllPresentation: SaveAllSaveCommandPresentation = $derived($saveAllStore);

	const isCreateFileEnabled: boolean = $derived(isAvailable(createFile));
	const isCreateFolderEnabled: boolean = $derived(isAvailable(createFolder));
	const isRenameEnabled: boolean = $derived(isAvailable(rename));
	const isDeleteEnabled: boolean = $derived(isAvailable(deletePresentation));
	const isCreateEnabled: boolean = $derived(isCreateFileEnabled || isCreateFolderEnabled);
	const isExpandNodeEnabled: boolean = $derived(
		expandNodePresentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE
	);
	const isCollapseNodeEnabled: boolean = $derived(
		collapseNodePresentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE
	);
	const isLocateActiveFileEnabled: boolean = $derived(
		locateActiveFilePresentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE
	);
	const isSaveAllEnabled: boolean = $derived(
		saveAllPresentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE
	);

	const RenameIcon: Component = $derived(resolveIcon(rename.icon));
	const DeleteIcon: Component = $derived(resolveIcon(deletePresentation.icon));

	function isAvailable(presentation: FileTreeActionBarPresentation): boolean {
		return presentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE;
	}

	function resolveIcon(icon: FileTreeActionIcon): Component {
		if (icon.kind === FileTreeActionIconKind.NONE) {
			return FALLBACK_ICON;
		}
		const component: Component | undefined = ACTION_ICON_REGISTRY[icon.name];
		if (component === undefined) {
			return FALLBACK_ICON;
		}
		return component;
	}

	function perform(presentation: FileTreeActionBarPresentation): void {
		if (presentation.availability.kind !== FileTreeActionAvailabilityKind.AVAILABLE) {
			return;
		}
		viewModel.request(presentation.availability.requestInput);
	}

	function handleCreateFile(): void {
		perform(createFile);
	}

	function handleCreateFolder(): void {
		perform(createFolder);
	}

	function handleRename(): void {
		perform(rename);
	}

	function handleDelete(): void {
		perform(deletePresentation);
	}

	function handleCollapseNode(): void {
		void viewModel.collapseAll();
	}

	function handleExpandNode(): void {
		void viewModel.expandAll();
	}

	function handleLocateFile(): void {
		void viewModel.revealActiveFile();
	}

	function handleSaveAll(): void {
		void viewModel.triggerSaveAll();
	}
</script>

<TooltipProvider>
	<div class="flex h-11 shrink-0 items-center justify-between border-b border-border/40 px-1.5">
		<div class="flex items-center gap-0.5">
			<div class="flex items-center rounded-md bg-muted/40 p-0.5">
				<TooltipRoot>
					<TooltipTrigger
						class={buttonVariants({
							variant: 'ghost',
							size: 'icon',
							className: 'size-7 rounded-md hover:bg-background/80'
						})}
						disabled={!isCollapseNodeEnabled}
						onclick={handleCollapseNode}
					>
						<ChevronsDownUp class="size-3.5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent side="bottom">{collapseNodePresentation.label}</TooltipContent>
				</TooltipRoot>

				<TooltipRoot>
					<TooltipTrigger
						class={buttonVariants({
							variant: 'ghost',
							size: 'icon',
							className: 'size-7 rounded-md hover:bg-background/80'
						})}
						disabled={!isExpandNodeEnabled}
						onclick={handleExpandNode}
					>
						<ChevronsUpDown class="size-3.5 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent side="bottom">{expandNodePresentation.label}</TooltipContent>
				</TooltipRoot>
			</div>

			<div class="mx-0.5 h-5 w-px bg-border/50"></div>

			<TooltipRoot>
				<TooltipTrigger
					class={buttonVariants({
						variant: 'ghost',
						size: 'icon',
						className: 'size-7 rounded-md hover:bg-accent/80'
					})}
					disabled={!isLocateActiveFileEnabled}
					onclick={handleLocateFile}
				>
					<Crosshair class="size-3.5 text-muted-foreground" />
				</TooltipTrigger>
				<TooltipContent side="bottom">{locateActiveFilePresentation.label}</TooltipContent>
			</TooltipRoot>

			<DropdownMenuRoot>
				<TooltipRoot>
					<TooltipTrigger>
						<DropdownMenuTrigger
							class={buttonVariants({
								variant: 'ghost',
								size: 'icon',
								className: 'size-7 rounded-md hover:bg-accent/80'
							})}
							disabled={!isCreateEnabled}
						>
							<Plus class="size-3.5 text-muted-foreground" />
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent side="bottom">{messages['fileTree.command.new']}</TooltipContent>
				</TooltipRoot>
				<DropdownMenuContent align="start" class="min-w-36">
					<DropdownMenuItem
						class="gap-2"
						disabled={!isCreateFileEnabled}
						onclick={handleCreateFile}
					>
						<ThemedIcon size={16} themed={fileIconID} />
						<span>{createFile.label}</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						class="gap-2"
						disabled={!isCreateFolderEnabled}
						onclick={handleCreateFolder}
					>
						<ThemedIcon size={16} themed={folderIconID} />
						<span>{createFolder.label}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuRoot>

			<TooltipRoot>
				<TooltipTrigger
					class={buttonVariants({
						variant: 'ghost',
						size: 'icon',
						className: 'size-7 rounded-md hover:bg-accent/80'
					})}
					disabled={!isRenameEnabled}
					onclick={handleRename}
				>
					<RenameIcon class="size-3.5 text-muted-foreground" />
				</TooltipTrigger>
				<TooltipContent side="bottom">{rename.label}</TooltipContent>
			</TooltipRoot>

			<TooltipRoot>
				<TooltipTrigger
					class={buttonVariants({
						variant: 'ghost',
						size: 'icon',
						className: 'size-7 rounded-md hover:bg-accent/80'
					})}
					disabled={!isDeleteEnabled}
					onclick={handleDelete}
				>
					<DeleteIcon class="size-3.5 text-destructive" />
				</TooltipTrigger>
				<TooltipContent side="bottom">{deletePresentation.label}</TooltipContent>
			</TooltipRoot>

			<div class="mx-0.5 h-5 w-px bg-border/50"></div>

			<TooltipRoot>
				<TooltipTrigger
					class={buttonVariants({
						variant: 'ghost',
						size: 'icon',
						className: 'size-7 rounded-md hover:bg-accent/80'
					})}
					disabled={!isSaveAllEnabled}
					onclick={handleSaveAll}
				>
					<SaveAll class="size-3.5 text-muted-foreground" />
				</TooltipTrigger>
				<TooltipContent side="bottom">{saveAllPresentation.label}</TooltipContent>
			</TooltipRoot>
		</div>

		<TooltipRoot>
			<TooltipTrigger
				class={buttonVariants({
					variant: 'ghost',
					size: 'icon',
					className: 'size-7 rounded-md hover:bg-accent/80'
				})}
				onclick={onCollapseSidebar}
			>
				<PanelLeftClose class="size-3.5 text-muted-foreground" />
			</TooltipTrigger>
			<TooltipContent side="bottom">{messages['sideBar.collapse']}</TooltipContent>
		</TooltipRoot>
	</div>
</TooltipProvider>
