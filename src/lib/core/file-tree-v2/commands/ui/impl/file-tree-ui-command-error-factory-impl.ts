import {
	FileTreeUICommandErrorKind,
	type FileTreeUICommandError
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command';
import {
	FileTreeUICommandErrorMessages,
	type IFileTreeUICommandErrorFactory
} from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command-error-factory';

export class FileTreeUICommandErrorFactory implements IFileTreeUICommandErrorFactory {
	public createActionDisabledError(commandLabel: string): FileTreeUICommandError {
		const message: string = FileTreeUICommandErrorMessages.ACTION_DISABLED(commandLabel);
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.ACTION_DISABLED,
			message: message
		};
		return error;
	}

	public createMissingSelectionError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.MISSING_SELECTION,
			message: FileTreeUICommandErrorMessages.MISSING_SELECTION
		};
		return error;
	}

	public createMissingActiveFileError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.MISSING_ACTIVE_FILE,
			message: FileTreeUICommandErrorMessages.MISSING_ACTIVE_FILE
		};
		return error;
	}

	public createMissingNodeError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.MISSING_NODE,
			message: FileTreeUICommandErrorMessages.MISSING_NODE
		};
		return error;
	}

	public createTargetNotFolderError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.TARGET_NOT_FOLDER,
			message: FileTreeUICommandErrorMessages.TARGET_NOT_FOLDER
		};
		return error;
	}

	public createAlreadyExpandedError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.ALREADY_EXPANDED,
			message: FileTreeUICommandErrorMessages.ALREADY_EXPANDED
		};
		return error;
	}

	public createAlreadyCollapsedError(): FileTreeUICommandError {
		const error: FileTreeUICommandError = {
			kind: FileTreeUICommandErrorKind.ALREADY_COLLAPSED,
			message: FileTreeUICommandErrorMessages.ALREADY_COLLAPSED
		};
		return error;
	}
}
