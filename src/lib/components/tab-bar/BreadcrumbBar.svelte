<script lang="ts">
	import { mode } from 'mode-watcher';

	import Icon from '$lib/components/file-tree/file-icon/Icon.svelte';
	import type { ThemeMode } from '$lib/components/file-tree/file-icon/icon-factory';
	import {
		type ActiveBreadcrumb,
		ActiveBreadcrumbKind
	} from '$lib/core/tab-bar/tab-projection-models';
	import {
		Item as BreadcrumbItem,
		List as BreadcrumbList,
		Page as BreadcrumbPage,
		Root as BreadcrumbRoot,
		Separator as BreadcrumbSeparator
	} from '$lib/ui-primitives/breadcrumb';
	import {
		createFileIconFactory,
		type IFileIconFactory
	} from '$lib/view-models/file-tree/icons/file-icon-factory';
	import type { ITabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2';

	interface Props {
		viewModel: ITabBarViewModelV2;
	}

	let { viewModel }: Props = $props();

	const fileIconFactory: IFileIconFactory = createFileIconFactory();

	let activeBreadcrumbReadable = $derived(viewModel.activeBreadcrumb);
	let activeBreadcrumb: ActiveBreadcrumb = $derived($activeBreadcrumbReadable);
	const THEME: ThemeMode = $derived(mode.current ?? 'light');
	const folderIconID: string = $derived(fileIconFactory.getFolderIconID(false, THEME));

	function getFileIconID(fileName: string): string {
		return fileIconFactory.getIconIDByFileName(fileName, THEME);
	}
</script>

{#if activeBreadcrumb.kind === ActiveBreadcrumbKind.PRESENT}
	<div class="flex min-h-8 items-center bg-background/80 px-3 backdrop-blur-sm">
		<BreadcrumbRoot>
			<BreadcrumbList class="flex-nowrap gap-1 sm:gap-1">
				{#each activeBreadcrumb.segments as segment, index (segment.fullPath)}
					{#if index > 0}
						<BreadcrumbSeparator class="text-muted-foreground/40 [&>svg]:size-3" />
					{/if}

					<BreadcrumbItem
						class="flex items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/50"
					>
						{#if segment.isFile}
							<Icon icon={getFileIconID(segment.name)} size={16} class="shrink-0 opacity-70" />
						{:else}
							<Icon icon={folderIconID} size={16} class="shrink-0 opacity-70" />
						{/if}
						<BreadcrumbPage
							class="max-w-36 truncate text-[13px] font-medium text-muted-foreground"
						>
							{segment.name}
						</BreadcrumbPage>
					</BreadcrumbItem>
				{/each}
			</BreadcrumbList>
		</BreadcrumbRoot>
	</div>
{/if}
