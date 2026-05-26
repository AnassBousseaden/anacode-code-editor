import type { OperationError } from '$lib/core/shared/models-utils';
import type { FileTreeActionError } from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';

export const FileTreeActionErrorMessages = {
	ACTION_DISABLED: (actionLabel: string): string => `Action "${actionLabel}" is disabled.`,
	MISSING_SELECTION: 'No node is selected.',
	MISSING_NODE: 'The selected node does not exist.',
	MISSING_NAME: 'A name is required.',
	PERMISSION_DENIED: (actionLabel: string): string =>
		`You do not have permission to perform "${actionLabel}".`,
	INVALID_TARGET: 'The target is not a valid destination.',
	FILE_SYSTEM_ERROR: (message: string): string => `File system error: ${message}`,
	UNSAVED_DRAFT: 'Cannot delete: file has unsaved changes.'
} as const;

export interface IFileTreeActionErrorFactory {
	createActionDisabledError(actionLabel: string): FileTreeActionError;

	createMissingSelectionError(): FileTreeActionError;

	createMissingNodeError(): FileTreeActionError;

	createMissingNameError(): FileTreeActionError;

	createPermissionDeniedError(actionLabel: string): FileTreeActionError;

	createInvalidTargetError(): FileTreeActionError;

	createFileSystemActionError(operationError: OperationError): FileTreeActionError;

	createUnsavedDraftError(): FileTreeActionError;
}
