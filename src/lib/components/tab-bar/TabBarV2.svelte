<script lang="ts">
	import { onDestroy } from 'svelte';

	import BreadcrumbBar from '$lib/components/tab-bar/BreadcrumbBar.svelte';
	import Tab from '$lib/components/tab-bar/Tab.svelte';
	import { ScrollArea } from '$lib/ui-primitives/scroll-area';

	import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
	import {
		type TabList,
		TabListKind
	} from '$lib/core/tab-bar/tab-projection-models';
	import type { IObservableTabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
	import type { ITabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2';
	import { TabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2-impl';
	import { TAB_BAR_ACTIVE_TAB_SELECTOR } from '$lib/components/tab-bar/tab-bar-data-attributes';
	import type { NodeID } from '$lib/core/file-system/domain/file-system-models';

	interface Props {
		tabProjection: IObservableTabProjectionService;
		intentCommands: IEditorIntentCommands;
	}

	let { tabProjection, intentCommands }: Props = $props();

	const viewModel: ITabBarViewModelV2 = new TabBarViewModelV2(tabProjection, intentCommands);

	let openTabsReadable = $derived(viewModel.openTabs);
	let openTabs: TabList = $derived($openTabsReadable);

	let viewportElement: HTMLElement | null = $state(null);

	const activeNodeID: NodeID | null = $derived(
		openTabs.kind === TabListKind.NON_EMPTY
			? (openTabs.tabs.find((tab): boolean => tab.isActive)?.nodeID ?? null)
			: null
	);

	$effect((): void => {
		if (activeNodeID === null || viewportElement === null) {
			return;
		}
		const activeTab: Element | null = viewportElement.querySelector(TAB_BAR_ACTIVE_TAB_SELECTOR);
		activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	});

	function handleWheel(event: WheelEvent): void {
		if (viewportElement === null || event.deltaY === 0) {
			return;
		}
		if (viewportElement.scrollWidth <= viewportElement.clientWidth) {
			return;
		}
		event.preventDefault();
		viewportElement.scrollLeft += event.deltaY;
	}

	onDestroy((): void => {
		viewModel.dispose();
	});
</script>

<div class="flex flex-col">
	{#if openTabs.kind === TabListKind.NON_EMPTY}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="relative flex h-9 items-stretch overflow-hidden border-b border-border bg-muted"
			onwheel={handleWheel}
			role="tablist"
		>
			<ScrollArea
				bind:viewportRef={viewportElement}
				class="h-full w-full"
				orientation="horizontal"
				scrollbarXClasses="h-1"
			>
				<div class="flex h-full w-max items-stretch">
					{#each openTabs.tabs as tab (tab.nodeID)}
						<Tab {viewModel} tabEntry={tab} />
					{/each}
				</div>
			</ScrollArea>
		</div>
	{/if}

	<BreadcrumbBar {viewModel} />
</div>
