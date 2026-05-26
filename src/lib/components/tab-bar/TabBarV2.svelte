<script lang="ts">
	import { onDestroy } from 'svelte';

	import BreadcrumbBar from '$lib/components/tab-bar/BreadcrumbBar.svelte';
	import Tab from '$lib/components/tab-bar/Tab.svelte';
	import { ScrollArea, Scrollbar } from '$lib/ui-primitives/scroll-area';

	import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
	import {
		type TabList,
		TabListKind
	} from '$lib/core/tab-bar/tab-projection-models';
	import type { IObservableTabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
	import type { ITabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2';
	import { TabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2-impl';

	interface Props {
		tabProjection: IObservableTabProjectionService;
		intentCommands: IEditorIntentCommands;
	}

	let { tabProjection, intentCommands }: Props = $props();

	const viewModel: ITabBarViewModelV2 = new TabBarViewModelV2(tabProjection, intentCommands);

	let openTabsReadable = $derived(viewModel.openTabs);
	let openTabs: TabList = $derived($openTabsReadable);

	onDestroy((): void => {
		viewModel.dispose();
	});
</script>

<div class="flex flex-col bg-card/30">
	{#if openTabs.kind === TabListKind.NON_EMPTY}
		<div class="relative flex h-10 items-stretch overflow-hidden border-b border-border/40">
			<ScrollArea class="h-full w-full" orientation="horizontal">
				<div class="flex h-full w-max items-stretch gap-0.5 px-1 py-1" role="tablist">
					{#each openTabs.tabs as tab (tab.nodeID)}
						<Tab {viewModel} tabEntry={tab} />
					{/each}
				</div>
				<Scrollbar orientation="horizontal" class="h-1.5" />
			</ScrollArea>
		</div>
	{/if}

	<BreadcrumbBar {viewModel} />
</div>
