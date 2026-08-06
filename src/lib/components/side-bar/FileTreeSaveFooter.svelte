<script lang="ts">
	import { SaveAll } from '@lucide/svelte';
	import type { Readable } from 'svelte/store';

	import { Button, type ButtonVariant } from '$lib/ui-primitives/button';

	import {
		FileTreeActionAvailabilityKind,
		type IFileTreeSaveCommandViewModel,
		type SaveAllSaveCommandPresentation
	} from '$lib/view-models/file-tree/action-bar/file-tree-action-bar-view-model';

	interface Props {
		viewModel: IFileTreeSaveCommandViewModel;
	}

	let { viewModel }: Props = $props();

	const saveAllStore: Readable<SaveAllSaveCommandPresentation> = $derived(viewModel.saveAll);
	const saveAllPresentation: SaveAllSaveCommandPresentation = $derived($saveAllStore);

	const isSaveAllEnabled: boolean = $derived(
		saveAllPresentation.availability.kind === FileTreeActionAvailabilityKind.AVAILABLE
	);
	const saveAllVariant: ButtonVariant = $derived(isSaveAllEnabled ? 'default' : 'secondary');

	function handleSaveAll(): void {
		void viewModel.triggerSaveAll();
	}
</script>

<div class="shrink-0 p-1.5">
	<Button
		class="w-full"
		disabled={!isSaveAllEnabled}
		onclick={handleSaveAll}
		size="sm"
		variant={saveAllVariant}
	>
		<SaveAll class="size-3.5" />
		<span>{saveAllPresentation.label}</span>
	</Button>
</div>
