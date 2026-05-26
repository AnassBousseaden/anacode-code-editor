<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { LoaderCircle } from '@lucide/svelte';

	import WorkspaceEditorPaneV2 from '$lib/components/WorkspaceEditorPaneV2.svelte';
	import type { IEditorSession } from '$lib/core/session/editor-session';

	interface Props {
		session: IEditorSession;
		sidebarFooter?: Snippet;
	}

	let { session, sidebarFooter }: Props = $props();

	let mounted: boolean = $state(false);

	onMount((): void => {
		mounted = true;
	});
</script>

<div class="relative h-full w-full">
	<div class="h-full w-full" class:invisible={!mounted}>
		<WorkspaceEditorPaneV2 {session} {sidebarFooter} />
	</div>
	{#if !mounted}
		<div class="absolute inset-0 flex items-center justify-center bg-background">
			<LoaderCircle class="size-6 animate-spin text-muted-foreground" />
		</div>
	{/if}
</div>
