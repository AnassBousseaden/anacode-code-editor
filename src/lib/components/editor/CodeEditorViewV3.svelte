<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';

	interface Props {
		viewModel: ICodeEditorComponentController;
		className?: string;
	}

	let { viewModel, className = '' }: Props = $props();

	let editorContainer = $state<HTMLElement>();

	onMount(() => {
		const controller: ICodeEditorComponentController = viewModel;
		if (editorContainer) {
			controller.attach(editorContainer);
		}
		return (): void => {
			controller.detach();
		};
	});
</script>

<div
	bind:this={editorContainer}
	class={cn('editor-container grow overflow-hidden', className)}
></div>
