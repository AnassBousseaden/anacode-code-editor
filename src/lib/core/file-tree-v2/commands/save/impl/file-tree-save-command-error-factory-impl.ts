import type { OperationError } from '$lib/core/shared/models-utils';
import {
	FileTreeSaveCommandErrorKind,
	type FileTreeSaveCommandError
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command';
import {
	FileTreeSaveCommandErrorMessages,
	type IFileTreeSaveCommandErrorFactory
} from '$lib/core/file-tree-v2/commands/save/file-tree-save-command-error-factory';

export class FileTreeSaveCommandErrorFactory implements IFileTreeSaveCommandErrorFactory {
	public createActionDisabledError(commandLabel: string): FileTreeSaveCommandError {
		const message: string = FileTreeSaveCommandErrorMessages.ACTION_DISABLED(commandLabel);
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.ACTION_DISABLED,
			message: message
		};
		return error;
	}

	public createMissingTargetError(): FileTreeSaveCommandError {
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.MISSING_TARGET,
			message: FileTreeSaveCommandErrorMessages.MISSING_TARGET
		};
		return error;
	}

	public createMissingNodeError(): FileTreeSaveCommandError {
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.MISSING_NODE,
			message: FileTreeSaveCommandErrorMessages.MISSING_NODE
		};
		return error;
	}

	public createTargetNotFileError(): FileTreeSaveCommandError {
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.TARGET_NOT_FILE,
			message: FileTreeSaveCommandErrorMessages.TARGET_NOT_FILE
		};
		return error;
	}

	public createNothingToSaveError(): FileTreeSaveCommandError {
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.NOTHING_TO_SAVE,
			message: FileTreeSaveCommandErrorMessages.NOTHING_TO_SAVE
		};
		return error;
	}

	public createSaveError(operationError: OperationError): FileTreeSaveCommandError {
		const message: string = FileTreeSaveCommandErrorMessages.SAVE_ERROR(operationError.message);
		const error: FileTreeSaveCommandError = {
			kind: FileTreeSaveCommandErrorKind.SAVE_ERROR,
			message: message,
			params: operationError.params,
			code: operationError.code
		};
		return error;
	}
}
