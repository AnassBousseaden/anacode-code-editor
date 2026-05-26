<script lang="ts">
	import type { Snippet } from 'svelte';

	import EditorSessionMountGate from '$lib/components/EditorSessionMountGate.svelte';
	import type { IEditorSession } from '$lib/core/session/editor-session';

	interface Props {
		session: IEditorSession;
		sidebarFooter?: Snippet;
	}

	let { session, sidebarFooter }: Props = $props();
</script>

{#key session}
	<EditorSessionMountGate {session} {sidebarFooter} />
{/key}
