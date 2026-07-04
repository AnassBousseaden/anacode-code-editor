<script lang="ts">
	import { Loader2 } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { get, type Unsubscriber } from 'svelte/store';

	import { Button } from '$lib/ui-primitives/button';
	import {
		Content as DialogContent,
		Description as DialogDescription,
		Footer as DialogFooter,
		Header as DialogHeader,
		Title as DialogTitle
	} from '$lib/ui-primitives/dialog';
	import { Input } from '$lib/ui-primitives/input';
	import { Label } from '$lib/ui-primitives/label';

	import type { EditorMessages } from '$lib/core/localization/localization-models';
	import { getEditorMessages } from '$lib/core/localization/messages-context';
	import {
		resolveFileTreeActionErrorContent,
		resolveFileTreeActionLabel
	} from '$lib/view-models/file-tree/localization/file-tree-action-messages';

	import type {
		CreateFileActionInput,
		CreateFolderActionInput,
		FileTreeActionError,
		RenameActionInput
	} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
	import {
		ActionDialogStateKind,
		type IActionDialogViewModel,
		type OpenCreateFileDialogState,
		type OpenCreateFolderDialogState,
		type OpenRenameDialogState
	} from '$lib/view-models/file-tree/dialog/action-dialog-view-model';
	import {
		type ILoadable,
		type Loadable,
		LoadableKind
	} from '$lib/view-models/shared/ui-models';

	import {
		type EditingInvalidNameInputDialogState,
		type EditingNameInputDialogState,
		type NameInputDialogState,
		NameInputDialogStateKind,
		type SubmitFailedNameInputDialogState,
		type SubmittingNameInputDialogState
	} from '$lib/components/dialog/name-input-dialog-state';

	type OpenNameInputDialogState =
		| OpenRenameDialogState
		| OpenCreateFileDialogState
		| OpenCreateFolderDialogState;

	interface Props {
		viewModel: IActionDialogViewModel;
		openState: OpenNameInputDialogState;
	}

	let { viewModel, openState }: Props = $props();

	const messages: EditorMessages = getEditorMessages();

	const titleLabel: string = resolveFileTreeActionLabel(messages, openState.request.descriptor.id);
	const contextLabel: string = openState.request.contextLabel;
	const submitLabel: string = titleLabel;

	let inputElement: HTMLInputElement | null = $state(null);

	let dialogState: NameInputDialogState = $state(buildEditingState(readInitialName(openState)));

	const isInputDisabled: boolean = $derived(
		dialogState.kind === NameInputDialogStateKind.SUBMITTING
	);

	const isSubmitDisabled: boolean = $derived.by((): boolean => {
		if (dialogState.kind === NameInputDialogStateKind.SUBMITTING) {
			return true;
		}
		if (dialogState.kind === NameInputDialogStateKind.EDITING_INVALID) {
			return true;
		}
		const trimmedName: string = dialogState.name.trim();
		return trimmedName === '';
	});

	const isCancelDisabled: boolean = $derived(
		dialogState.kind === NameInputDialogStateKind.SUBMITTING
	);

	$effect((): void => {
		void focusAndSelectInput();
	});

	$effect((): Unsubscriber | void => {
		if (dialogState.kind !== NameInputDialogStateKind.SUBMITTING) {
			return;
		}
		const submittedName: string = dialogState.name;
		const performLoadable: ILoadable<unknown, FileTreeActionError> = runPerform(
			openState,
			submittedName
		);
		const unsubscribe: Unsubscriber = performLoadable.state.subscribe(
			(current: Loadable<unknown, FileTreeActionError>): void => {
				if (current.kind === LoadableKind.SUCCESS) {
					viewModel.close();
					return;
				}
				if (current.kind === LoadableKind.FAILURE) {
					const failed: SubmitFailedNameInputDialogState = {
						kind: NameInputDialogStateKind.SUBMIT_FAILED,
						name: submittedName,
						submitError: current.error
					};
					dialogState = failed;
				}
			}
		);
		return unsubscribe;
	});

	function readInitialName(source: OpenNameInputDialogState): string {
		switch (source.kind) {
			case ActionDialogStateKind.OPEN_RENAME: {
				const initial: RenameActionInput = source.request.initialInput;
				return initial.newName;
			}
			case ActionDialogStateKind.OPEN_CREATE_FILE: {
				const initial: CreateFileActionInput = source.request.initialInput;
				return initial.name;
			}
			case ActionDialogStateKind.OPEN_CREATE_FOLDER: {
				const initial: CreateFolderActionInput = source.request.initialInput;
				return initial.name;
			}
		}
	}

	function buildEditingState(name: string): NameInputDialogState {
		const editing: EditingNameInputDialogState = {
			kind: NameInputDialogStateKind.EDITING,
			name: name
		};
		return editing;
	}

	function readValidation(
		source: OpenNameInputDialogState,
		name: string
	): Loadable<void, FileTreeActionError> {
		const trimmedName: string = name.trim();
		switch (source.kind) {
			case ActionDialogStateKind.OPEN_RENAME: {
				const input: RenameActionInput = { newName: trimmedName };
				const loadable: ILoadable<void, FileTreeActionError> = source.request.validate(input);
				return get(loadable.state);
			}
			case ActionDialogStateKind.OPEN_CREATE_FILE: {
				const input: CreateFileActionInput = { name: trimmedName };
				const loadable: ILoadable<void, FileTreeActionError> = source.request.validate(input);
				return get(loadable.state);
			}
			case ActionDialogStateKind.OPEN_CREATE_FOLDER: {
				const input: CreateFolderActionInput = { name: trimmedName };
				const loadable: ILoadable<void, FileTreeActionError> = source.request.validate(input);
				return get(loadable.state);
			}
		}
	}

	function runPerform(
		source: OpenNameInputDialogState,
		name: string
	): ILoadable<unknown, FileTreeActionError> {
		const trimmedName: string = name.trim();
		switch (source.kind) {
			case ActionDialogStateKind.OPEN_RENAME: {
				const input: RenameActionInput = { newName: trimmedName };
				return source.request.perform(input);
			}
			case ActionDialogStateKind.OPEN_CREATE_FILE: {
				const input: CreateFileActionInput = { name: trimmedName };
				return source.request.perform(input);
			}
			case ActionDialogStateKind.OPEN_CREATE_FOLDER: {
				const input: CreateFolderActionInput = { name: trimmedName };
				return source.request.perform(input);
			}
		}
	}

	async function focusAndSelectInput(): Promise<void> {
		await tick();
		if (inputElement === null) {
			return;
		}
		inputElement.focus();
		inputElement.select();
	}

	function transitionFromInput(name: string): NameInputDialogState {
		const trimmedName: string = name.trim();
		if (trimmedName === '') {
			return buildEditingState(name);
		}
		const validation: Loadable<void, FileTreeActionError> = readValidation(openState, name);
		if (validation.kind === LoadableKind.FAILURE) {
			const invalid: EditingInvalidNameInputDialogState = {
				kind: NameInputDialogStateKind.EDITING_INVALID,
				name: name,
				validationError: validation.error
			};
			return invalid;
		}
		return buildEditingState(name);
	}

	function handleInput(event: Event): void {
		if (dialogState.kind === NameInputDialogStateKind.SUBMITTING) {
			return;
		}
		const target: HTMLInputElement = event.currentTarget as HTMLInputElement;
		const newName: string = target.value;
		dialogState = transitionFromInput(newName);
	}

	function handleSubmit(): void {
		if (dialogState.kind === NameInputDialogStateKind.SUBMITTING) {
			return;
		}
		if (dialogState.kind === NameInputDialogStateKind.EDITING_INVALID) {
			return;
		}
		const trimmedName: string = dialogState.name.trim();
		if (trimmedName === '') {
			return;
		}
		const validation: Loadable<void, FileTreeActionError> = readValidation(
			openState,
			dialogState.name
		);
		if (validation.kind === LoadableKind.FAILURE) {
			const invalid: EditingInvalidNameInputDialogState = {
				kind: NameInputDialogStateKind.EDITING_INVALID,
				name: dialogState.name,
				validationError: validation.error
			};
			dialogState = invalid;
			return;
		}
		const submitting: SubmittingNameInputDialogState = {
			kind: NameInputDialogStateKind.SUBMITTING,
			name: trimmedName
		};
		dialogState = submitting;
	}

	function handleCancel(): void {
		if (dialogState.kind === NameInputDialogStateKind.SUBMITTING) {
			return;
		}
		viewModel.close();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key !== 'Enter') {
			return;
		}
		event.preventDefault();
		handleSubmit();
	}
</script>

<DialogContent class="sm:max-w-md">
	<DialogHeader class="space-y-1.5">
		<DialogTitle class="text-lg font-semibold">{titleLabel}</DialogTitle>
		<DialogDescription class="text-sm text-muted-foreground">{contextLabel}</DialogDescription>
	</DialogHeader>

	<div class="space-y-2 py-2">
		<Label class="text-sm font-medium" for="name-input-dialog-input"
			>{messages['dialog.nameInput.nameLabel']}</Label
		>
		<Input
			bind:ref={inputElement}
			class="h-10"
			disabled={isInputDisabled}
			id="name-input-dialog-input"
			oninput={handleInput}
			onkeydown={handleKeyDown}
			placeholder={messages['dialog.nameInput.placeholder']}
			value={dialogState.name}
		/>

		{#if dialogState.kind === NameInputDialogStateKind.EDITING_INVALID}
			<p class="text-xs text-failure-foreground">
				{resolveFileTreeActionErrorContent(messages, dialogState.validationError)}
			</p>
		{:else if dialogState.kind === NameInputDialogStateKind.SUBMIT_FAILED}
			<p class="rounded-md bg-failure px-2.5 py-1.5 text-xs text-failure-foreground">
				{resolveFileTreeActionErrorContent(messages, dialogState.submitError)}
			</p>
		{/if}
	</div>

	<DialogFooter class="gap-2 sm:gap-2">
		<Button disabled={isCancelDisabled} onclick={handleCancel} variant="outline"
			>{messages['common.cancel']}</Button
		>
		<Button disabled={isSubmitDisabled} onclick={handleSubmit}>
			{#if dialogState.kind === NameInputDialogStateKind.SUBMITTING}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
			{/if}
			{submitLabel}
		</Button>
	</DialogFooter>
</DialogContent>
