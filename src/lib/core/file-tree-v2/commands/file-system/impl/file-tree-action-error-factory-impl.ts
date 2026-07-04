import type { OperationError } from '$lib/core/shared/models-utils';
import {
	FileTreeActionErrorKind,
	type FileTreeActionError
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import {
	FileTreeActionErrorMessages,
	type IFileTreeActionErrorFactory
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action-error-factory';

export class FileTreeActionErrorFactory implements IFileTreeActionErrorFactory {
	public createActionDisabledError(actionLabel: string): FileTreeActionError {
		const message: string = FileTreeActionErrorMessages.ACTION_DISABLED(actionLabel);
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.ACTION_DISABLED,
			message: message
		};
		return error;
	}

	public createMissingSelectionError(): FileTreeActionError {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.MISSING_SELECTION,
			message: FileTreeActionErrorMessages.MISSING_SELECTION
		};
		return error;
	}

	public createMissingNodeError(): FileTreeActionError {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.MISSING_NODE,
			message: FileTreeActionErrorMessages.MISSING_NODE
		};
		return error;
	}

	public createMissingNameError(): FileTreeActionError {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.MISSING_NAME,
			message: FileTreeActionErrorMessages.MISSING_NAME
		};
		return error;
	}

	public createPermissionDeniedError(actionLabel: string): FileTreeActionError {
		const message: string = FileTreeActionErrorMessages.PERMISSION_DENIED(actionLabel);
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.PERMISSION_DENIED,
			message: message
		};
		return error;
	}

	public createInvalidTargetError(): FileTreeActionError {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.INVALID_TARGET,
			message: FileTreeActionErrorMessages.INVALID_TARGET
		};
		return error;
	}

	public createFileSystemActionError(operationError: OperationError): FileTreeActionError {
		const message: string = FileTreeActionErrorMessages.FILE_SYSTEM_ERROR(operationError.message);
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.FILE_SYSTEM_ERROR,
			message: message,
			params: operationError.params,
			code: operationError.code
		};
		return error;
	}

	public createUnsavedDraftError(): FileTreeActionError {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.UNSAVED_DRAFT,
			message: FileTreeActionErrorMessages.UNSAVED_DRAFT
		};
		return error;
	}
}
