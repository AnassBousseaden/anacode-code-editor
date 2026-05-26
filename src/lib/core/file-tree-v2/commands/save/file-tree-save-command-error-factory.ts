import type { OperationError } from '$lib/core/shared/models-utils';
import type { FileTreeSaveCommandError } from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';

export const FileTreeSaveCommandErrorMessages = {
	ACTION_DISABLED: (commandLabel: string): string => `Command "${commandLabel}" is disabled.`,
	MISSING_TARGET: 'No save target is specified.',
	MISSING_NODE: 'The target node does not exist.',
	TARGET_NOT_FILE: 'The target is not a file.',
	NOTHING_TO_SAVE: 'There is nothing to save.',
	SAVE_ERROR: (message: string): string => `Save failed: ${message}.`
} as const;

export interface IFileTreeSaveCommandErrorFactory {
	createActionDisabledError(commandLabel: string): FileTreeSaveCommandError;

	createMissingTargetError(): FileTreeSaveCommandError;

	createMissingNodeError(): FileTreeSaveCommandError;

	createTargetNotFileError(): FileTreeSaveCommandError;

	createNothingToSaveError(): FileTreeSaveCommandError;

	createSaveError(operationError: OperationError): FileTreeSaveCommandError;
}
