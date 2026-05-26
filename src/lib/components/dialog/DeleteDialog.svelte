<script lang="ts">
	import { AlertTriangle, Loader2, Trash2 } from '@lucide/svelte';
	import type { Unsubscriber } from 'svelte/store';

	import { Button } from '$lib/ui-primitives/button';
	import {
		Content as DialogContent,
		Description as DialogDescription,
		Footer as DialogFooter,
		Header as DialogHeader,
		Title as DialogTitle
	} from '$lib/ui-primitives/dialog';

	import type { FileTreeActionError } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
	import type {
		IActionDialogViewModel,
		OpenDeleteDialogState
	} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';
	import {
		type ILoadable,
		type Loadable,
		LoadableKind
	} from '$lib/view-models/shared/ui-models';

	import {
		type ConfirmingDeleteDialogState,
		type DeleteDialogState,
		DeleteDialogStateKind,
		type SubmitFailedDeleteDialogState,
		type SubmittingDeleteDialogState
	} from '$lib/components/dialog/delete-dialog-state';

	interface Props {
		viewModel: IActionDialogViewModel;
		openState: OpenDeleteDialogState;
	}

	let { viewModel, openState }: Props = $props();

	const titleLabel: string = openState.request.descriptor.label;
	const contextLabel: string = openState.request.contextLabel;
	const submitLabel: string = openState.request.descriptor.label;

	let dialogState: DeleteDialogState = $state(buildConfirmingState());

	const isCancelDisabled: boolean = $derived(
		dialogState.kind === DeleteDialogStateKind.SUBMITTING
	);

	const isConfirmDisabled: boolean = $derived(
		dialogState.kind === DeleteDialogStateKind.SUBMITTING
	);

	$effect((): Unsubscriber | void => {
		if (dialogState.kind !== DeleteDialogStateKind.SUBMITTING) {
			return;
		}
		const performLoadable: ILoadable<unknown, FileTreeActionError> = openState.request.perform();
		const unsubscribe: Unsubscriber = performLoadable.state.subscribe(
			(current: Loadable<unknown, FileTreeActionError>): void => {
				if (current.kind === LoadableKind.SUCCESS) {
					viewModel.close();
					return;
				}
				if (current.kind === LoadableKind.FAILURE) {
					const failed: SubmitFailedDeleteDialogState = {
						kind: DeleteDialogStateKind.SUBMIT_FAILED,
						submitError: current.error
					};
					dialogState = failed;
				}
			}
		);
		return unsubscribe;
	});

	function buildConfirmingState(): DeleteDialogState {
		const confirming: ConfirmingDeleteDialogState = {
			kind: DeleteDialogStateKind.CONFIRMING
		};
		return confirming;
	}

	function handleConfirm(): void {
		if (dialogState.kind === DeleteDialogStateKind.SUBMITTING) {
			return;
		}
		const submitting: SubmittingDeleteDialogState = {
			kind: DeleteDialogStateKind.SUBMITTING
		};
		dialogState = submitting;
	}

	function handleCancel(): void {
		if (dialogState.kind === DeleteDialogStateKind.SUBMITTING) {
			return;
		}
		viewModel.close();
	}
</script>

<DialogContent class="sm:max-w-md">
	<DialogHeader class="space-y-2">
		<div class="flex items-center gap-3">
			<span
				class="flex size-9 shrink-0 items-center justify-center rounded-full bg-failure text-failure-foreground"
			>
				<AlertTriangle class="size-4" />
			</span>
			<DialogTitle class="text-lg font-semibold">{titleLabel}</DialogTitle>
		</div>
		<DialogDescription class="text-sm text-muted-foreground">{contextLabel}</DialogDescription>
	</DialogHeader>

	<div class="space-y-2 py-2">
		<p class="text-sm text-muted-foreground">This action cannot be undone.</p>

		{#if dialogState.kind === DeleteDialogStateKind.SUBMIT_FAILED}
			<p class="rounded-md bg-failure px-2.5 py-1.5 text-xs text-failure-foreground">
				{dialogState.submitError.message}
			</p>
		{/if}
	</div>

	<DialogFooter class="gap-2 sm:gap-2">
		<Button disabled={isCancelDisabled} onclick={handleCancel} variant="outline">Cancel</Button>
		<Button disabled={isConfirmDisabled} onclick={handleConfirm} variant="destructive">
			{#if dialogState.kind === DeleteDialogStateKind.SUBMITTING}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
			{:else}
				<Trash2 class="mr-1.5 size-4" />
			{/if}
			{submitLabel}
		</Button>
	</DialogFooter>
</DialogContent>
