<script lang="ts">
	import type { Readable } from 'svelte/store';

	import { Root as DialogRoot } from '$lib/ui-primitives/dialog';

	import {
		type ActionDialogState,
		ActionDialogStateKind,
		type IActionDialogViewModel
	} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';

	import DeleteDialog from '$lib/components/dialog/DeleteDialog.svelte';
	import NameInputDialog from '$lib/components/dialog/NameInputDialog.svelte';

	interface Props {
		viewModel: IActionDialogViewModel;
	}

	let { viewModel }: Props = $props();

	const stateStore: Readable<ActionDialogState> = $derived(viewModel.state);
	const currentState: ActionDialogState = $derived($stateStore);
	const isOpen: boolean = $derived(currentState.kind !== ActionDialogStateKind.CLOSED);

	function handleOpenChange(open: boolean): void {
		if (open) {
			return;
		}
		viewModel.close();
	}
</script>

<DialogRoot open={isOpen} onOpenChange={handleOpenChange}>
	{#if currentState.kind === ActionDialogStateKind.OPEN_RENAME || currentState.kind === ActionDialogStateKind.OPEN_CREATE_FILE || currentState.kind === ActionDialogStateKind.OPEN_CREATE_FOLDER}
		{#key currentState.request}
			<NameInputDialog viewModel={viewModel} openState={currentState} />
		{/key}
	{:else if currentState.kind === ActionDialogStateKind.OPEN_DELETE}
		{#key currentState.request}
			<DeleteDialog viewModel={viewModel} openState={currentState} />
		{/key}
	{/if}
</DialogRoot>
