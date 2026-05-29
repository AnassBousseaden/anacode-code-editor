import { writable, type Writable } from 'svelte/store';

export const isEditorModalOpen: Writable<boolean> = writable<boolean>(false);

export function onOpenEditorSettings(): void {
	isEditorModalOpen.set(true);
}
