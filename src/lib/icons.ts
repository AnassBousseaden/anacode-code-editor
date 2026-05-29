/**
 * File icons: the Icon component plus the icon-factory subsystem.
 *
 * NOTE: the icon factory currently lives across two layers (components/ and
 * view-models/). This barrel presents a single entry point over that split;
 * source consolidation is tracked as follow-up debt.
 *
 * @module @anacode/code-editor/icons
 */
export { default as Icon } from '$lib/components/file-tree/file-icon/Icon.svelte';
export * from '$lib/components/file-tree/file-icon/icon-factory';
export * from '$lib/view-models/file-tree/icons/file-icon-factory';
export * from '$lib/view-models/file-tree/icons/vscode-file-icon-factory';
