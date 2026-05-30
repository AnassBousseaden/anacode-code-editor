<script lang="ts">
	import type { Snippet } from 'svelte';
	import { type Readable } from 'svelte/store';
	import SideBarV2 from '$lib/components/side-bar/SideBarV2.svelte';
	import TabBarV2 from '$lib/components/tab-bar/TabBarV2.svelte';
	import EditorFooter from '$lib/components/EditorFooter.svelte';
	import CodeEditorViewV3 from '$lib/components/editor/CodeEditorViewV3.svelte';
	import EditorPromptStack from '$lib/components/editor-prompt/EditorPromptStack.svelte';
	import {
		Handle as ResizableHandle,
		Pane as ResizablePane,
		PaneGroup as ResizablePaneGroup
	} from '$lib/ui-primitives/resizable';
	import { LoaderCircle, PanelLeft } from '@lucide/svelte';
	import { buttonVariants } from '$lib/ui-primitives/button';
	import {
		Content as TooltipContent,
		Provider as TooltipProvider,
		Root as TooltipRoot,
		Trigger as TooltipTrigger
	} from '$lib/ui-primitives/tooltip/index';
	import type { IEditorSession } from '$lib/core/session/editor-session';
	import { WorkspaceStatus } from '$lib/core/workspace/editor-workspace-v2';

	interface Props {
		session: IEditorSession;
		sidebarFooter?: Snippet;
	}

	let { session, sidebarFooter }: Props = $props();

	const SIDEBAR_DEFAULT_SIZE = 40;
	const SIDEBAR_MIN_SIZE = 15;
	const SIDEBAR_MAX_SIZE = 50;
	const SIDEBAR_COLLAPSED_SIZE = 4;

	let sidebarPane: ReturnType<typeof ResizablePane>;
	let isCollapsed = $state(false);

	function handleCollapse(): void {
		isCollapsed = true;
	}

	function handleExpand(): void {
		isCollapsed = false;
	}

	function toggleSidebar(): void {
		if (isCollapsed) {
			sidebarPane.expand();
		} else {
			sidebarPane.collapse();
		}
	}

	const statusStore: Readable<WorkspaceStatus> = session.workspace.status;
</script>

<TooltipProvider>
	<div
		class="relative flex h-full w-full flex-grow select-none overflow-hidden bg-background font-sans text-foreground antialiased"
	>
		<ResizablePaneGroup class="h-full w-full" direction="horizontal">
			<ResizablePane
				bind:this={sidebarPane}
				class="flex flex-col bg-card/50 backdrop-blur-sm"
				collapsedSize={SIDEBAR_COLLAPSED_SIZE}
				collapsible={true}
				defaultSize={SIDEBAR_DEFAULT_SIZE}
				maxSize={SIDEBAR_MAX_SIZE}
				minSize={SIDEBAR_MIN_SIZE}
				onCollapse={handleCollapse}
				onExpand={handleExpand}
			>
				{#if isCollapsed}
					<div class="flex h-11 items-center justify-center border-b border-border/40">
						<TooltipRoot>
							<TooltipTrigger
								class={buttonVariants({
									variant: 'ghost',
									size: 'icon',
									className: 'size-8 rounded-md hover:bg-accent/80'
								})}
								onclick={toggleSidebar}
							>
								<PanelLeft class="size-4 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent side="right">Expand Sidebar</TooltipContent>
						</TooltipRoot>
					</div>
				{:else if $statusStore === WorkspaceStatus.LOADING}
					<div class="flex h-full items-center justify-center">
						<LoaderCircle class="size-5 animate-spin text-muted-foreground" />
					</div>
				{:else}
					<SideBarV2
						fileTreeWorkspace={session.workspace.fileTreeWorkspace}
						selectionIntent={session.selection}
						intentCommands={session.intent}
						notificationPublisher={session.promptManager}
						onCollapseSidebar={toggleSidebar}
						{sidebarFooter}
					/>
				{/if}
			</ResizablePane>

			<ResizableHandle class="w-px bg-border/50 transition-colors hover:bg-primary/50" />

			<ResizablePane class="flex min-w-0 flex-col bg-background" defaultSize={75}>
				<TabBarV2 tabProjection={session.tabProjection} intentCommands={session.intent} />
				<div class="flex min-h-0 flex-1 flex-col">
					<div class="relative flex min-h-0 flex-1">
						<div class="absolute inset-0 flex bg-background" id="editor-container">
							<CodeEditorViewV3 viewModel={session.codeEditor} />
						</div>

						<EditorPromptStack {session} />
					</div>
					<EditorFooter {session} />
				</div>
			</ResizablePane>
		</ResizablePaneGroup>
	</div>
</TooltipProvider>
