<script lang="ts">
	import { get } from 'svelte/store';

	import type { IEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
	import { Button } from '$lib/ui-primitives/button';
	import {
		Content as DialogContent,
		Description as DialogDescription,
		Footer as DialogFooter,
		Header as DialogHeader,
		Root as DialogRoot,
		Title as DialogTitle
	} from '$lib/ui-primitives/dialog';
	import { Label } from '$lib/ui-primitives/label';
	import {
		Content as SelectContent,
		Group as SelectGroup,
		Item as SelectItem,
		Label as SelectLabel,
		Root as SelectRoot,
		Trigger as SelectTrigger
	} from '$lib/ui-primitives/select';
	import { Slider } from '$lib/ui-primitives/slider';
	import { Switch } from '$lib/ui-primitives/switch';

	import { EditorConfigurationService } from './editor-config.svelte';
	import { isEditorModalOpen } from './editor-settings-modal-controller';

	const editorConfigurationService: IEditorConfigurationService =
		EditorConfigurationService.getInstance();

	const MIN_FONT_SIZE: number = 10;
	const MAX_FONT_SIZE: number = 24;
	const TAB_SIZES: ReadonlyArray<string> = ['2', '4'];

	let fontSize: number = $state(get(editorConfigurationService.editorConfiguration).fontSize);
	let tabSize: string = $state(
		String(get(editorConfigurationService.editorModelConfig).tabSize)
	);
	let wordWrap: boolean = $state(
		get(editorConfigurationService.editorConfiguration).wordWrap === 'on'
	);

	function onSave(): void {
		editorConfigurationService.setFontSize(fontSize);
		editorConfigurationService.setTabSize(Number(tabSize));
		editorConfigurationService.updateGlobalConfigs({ wordWrap: wordWrap ? 'on' : 'off' });
		isEditorModalOpen.set(false);
	}
</script>

<DialogRoot bind:open={$isEditorModalOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Editor Settings</DialogTitle>
			<DialogDescription>Adjust your editor font, tab size, and wrap behavior.</DialogDescription>
		</DialogHeader>

		<div class="grid grid-cols-2 auto-rows-fr items-center gap-y-3">
			<Label>Font Size</Label>
			<div class="flex items-center gap-3">
				<Slider
					bind:value={fontSize}
					class="flex-1"
					max={MAX_FONT_SIZE}
					min={MIN_FONT_SIZE}
					step={1}
					type="single"
				/>
				<span class="w-12 text-center text-sm tabular-nums">{fontSize}px</span>
			</div>

			<Label class="text-nowrap">Tab Size</Label>
			<SelectRoot bind:value={tabSize} name="tabSize" type="single">
				<SelectTrigger class="w-full">{tabSize} spaces</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Sizes</SelectLabel>
						{#each TAB_SIZES as size (size)}
							<SelectItem value={size} label={`${size} spaces`} />
						{/each}
					</SelectGroup>
				</SelectContent>
			</SelectRoot>
		</div>

		<div class="flex items-center justify-between pt-1">
			<Label>Word Wrap</Label>
			<Switch bind:checked={wordWrap} />
		</div>

		<DialogFooter>
			<Button class="flex-1 justify-center" onclick={onSave}>Save</Button>
		</DialogFooter>
	</DialogContent>
</DialogRoot>
