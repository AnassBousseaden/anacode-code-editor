import type { EditorMessages } from '$lib/core/localization/localization-models';

// English reference pack: implements the full EditorMessages contract;
// fr/es overlays fall back here.
export const en: EditorMessages = {
	commonCancel: 'Cancel',
	commonClose: 'Close',
	commonRetry: 'Retry',

	commonStatusUnsaved: 'Unsaved',
	commonStatusConflicted: 'Conflicted',
	commonStatusInvalid: 'Invalid',

	tabCloseAriaLabel: (params: { readonly name: string }): string => `Close ${params.name}`,

	fileTreeCommandNew: 'New',
	fileTreeCommandFile: 'File',
	fileTreeCommandFolder: 'Folder',
	fileTreeCommandRename: 'Rename',
	fileTreeCommandDelete: 'Delete',
	fileTreeCommandCopyPath: 'Copy path',

	fileTreeActionCreateFileLabel: 'Create File',
	fileTreeActionCreateFolderLabel: 'Create Folder',
	fileTreeActionMoveLabel: 'Move',

	fileTreeUiCommandExpandNodeLabel: 'Expand All',
	fileTreeUiCommandCollapseNodeLabel: 'Collapse All',
	fileTreeUiCommandLocateActiveFileLabel: 'Locate File',

	fileTreeSaveCommandSaveLabel: 'Save',
	fileTreeSaveCommandSaveAllLabel: 'Save All',

	fileTreeNotificationCopyFailed: 'Copy failed',
	fileTreeNotificationPathCopied: 'Path copied',
	fileTreeNotificationActionFailed: 'Action failed',
	fileTreeNotificationSaveFailed: 'Save failed',

	fileTreeErrorActionDisabled: 'This action is not available right now.',
	fileTreeErrorMissingSelection: 'No item is selected.',
	fileTreeErrorMissingNode: 'The selected item no longer exists.',
	fileTreeErrorMissingName: 'A name is required.',
	fileTreeErrorPermissionDenied: 'You do not have permission to do that.',
	fileTreeErrorInvalidTarget: 'That is not a valid destination.',
	fileTreeErrorFileSystem: 'A file system error occurred.',
	fileTreeErrorNameExists: (params: { readonly name: string }): string =>
		`A file or folder named "${params.name}" already exists.`,
	fileTreeErrorUnsavedDraft: 'This file has unsaved changes.',
	fileTreeErrorMissingActiveFile: 'No file is currently open.',
	fileTreeErrorTargetNotFolder: 'The target is not a folder.',
	fileTreeErrorAlreadyExpanded: 'The folder is already expanded.',
	fileTreeErrorAlreadyCollapsed: 'The folder is already collapsed.',
	fileTreeErrorMissingTarget: 'No save target is specified.',
	fileTreeErrorTargetNotFile: 'The target is not a file.',
	fileTreeErrorNothingToSave: 'There is nothing to save.',
	fileTreeErrorSaveFailed: 'Could not save the file.',

	sideBarSearchPlaceholder: 'Search',
	sideBarCollapse: 'Collapse Sidebar',
	sideBarExpand: 'Expand Sidebar',

	dialogDeleteWarning: 'This action cannot be undone.',

	dialogNameInputNameLabel: 'Name',
	dialogNameInputPlaceholder: 'Enter name...',

	promptConflictTitle: 'File changed on disk',
	promptConflictBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} changed on disk since you opened it.`,
	promptConflictReload: 'Reload from disk',
	promptConflictOverwrite: 'Overwrite disk',

	promptConflictNotFound: 'Document is no longer open.',
	promptConflictStaleRevision: 'File changed again on disk — try again.',
	promptConflictNotConflicted: 'File is no longer conflicted.',
	promptConflictInvalid: 'File no longer exists on disk.',
	promptConflictReadOnly: 'File is read-only.',
	promptConflictWriteFailed: 'Could not write to disk.',
	promptConflictReadFailed: 'Could not read from disk.',
	promptConflictDisposed: 'Document was closed.',

	promptInvalidDocTitle: 'File no longer exists',
	promptInvalidDocBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} was removed from disk.`,
	promptInvalidDocClose: 'Close file',

	promptInvalidDocStaleRevision: 'Document state changed — try again.',
	promptInvalidDocNotInvalid: 'Document is no longer invalid.',
	promptInvalidDocCloseFailed: 'Could not close the document.',
	promptInvalidDocDisposed: 'Editor was closed.',

	promptCloseFailureUnsavedDraftTitle: 'Unsaved changes',
	promptCloseFailureUnsavedDraftContent: 'Save or discard before closing.',

	promptNotificationBarHidden: (params: { readonly count: number }): string =>
		`${params.count} hidden`,

	breadcrumbAriaLabel: 'breadcrumb',
	breadcrumbMore: 'More',

	sessionErrorHydrationFailed: 'Failed to hydrate the editor session.',
	sessionErrorFileSystemLoadFailed: (params: { readonly cause: string }): string =>
		`Failed to load the file system: ${params.cause}`,
	sessionErrorMonacoLoadFailed: (params: { readonly cause: string }): string =>
		`Failed to load the Monaco runtime: ${params.cause}`,

	persistenceErrorImportInvalidFormat: 'The provided data is not a valid zip archive.',
	persistenceErrorImportReadFailed: 'Failed to read content from the archive.',
	persistenceErrorImportStructureInvalid:
		'The archive structure cannot be mapped to the file system.',
	persistenceErrorExportNodeNotFound: 'A referenced item was not found in the file system.',
	persistenceErrorExportEmptySelection: 'There is nothing to export.',
	persistenceErrorExportCompressionFailed: 'Failed to create the zip archive.',
	persistenceErrorExportFormattingFailed: 'Failed to format file content.'
};
