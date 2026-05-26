<script lang="ts">
	import EditorPromptNotificationBar from '$lib/components/editor-prompt/EditorPromptNotificationBar.svelte';
	import type { IEditorSession } from '$lib/core/session/editor-session';

	interface Props {
		session: IEditorSession;
	}

	let { session }: Props = $props();
</script>

<div
	class="flex h-7 items-center justify-end gap-2 border-t border-border/40 bg-card/30 px-3 text-xs"
>
	<EditorPromptNotificationBar {session} />
</div>
