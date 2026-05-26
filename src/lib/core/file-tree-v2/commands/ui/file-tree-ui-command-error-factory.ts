import type { FileTreeUICommandError } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';

export const FileTreeUICommandErrorMessages = {
	ACTION_DISABLED: (commandLabel: string): string => `Command "${commandLabel}" is disabled.`,
	MISSING_SELECTION: 'No node is selected.',
	MISSING_ACTIVE_FILE: 'No active file is currently open.',
	MISSING_NODE: 'The referenced node does not exist.',
	TARGET_NOT_FOLDER: 'The target is not a folder.',
	ALREADY_EXPANDED: 'The folder is already expanded.',
	ALREADY_COLLAPSED: 'The folder is already collapsed.'
} as const;

export interface IFileTreeUICommandErrorFactory {
	createActionDisabledError(commandLabel: string): FileTreeUICommandError;

	createMissingSelectionError(): FileTreeUICommandError;

	createMissingActiveFileError(): FileTreeUICommandError;

	createMissingNodeError(): FileTreeUICommandError;

	createTargetNotFolderError(): FileTreeUICommandError;

	createAlreadyExpandedError(): FileTreeUICommandError;

	createAlreadyCollapsedError(): FileTreeUICommandError;
}
