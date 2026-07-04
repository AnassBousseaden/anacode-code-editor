/**
 * English reference catalog — the full message key set and the fallback source.
 *
 * `en` is mandatory and complete: every {@link EditorMessageKey} lives here, and
 * missing keys in the `fr`/`es` overlays fall back to these strings. Keys are
 * flat, dot-namespaced (`<area>.<subject>.<slot>`); interpolation placeholders
 * use `{camelCase}` names matching the param object passed to `formatMessage`.
 *
 * Later phases extend this catalog as strings are extracted from components and
 * view-models. It is intentionally minimal for now.
 */
export const en = {
	// Common — shared words reused across screens
	'common.cancel': 'Cancel',
	'common.close': 'Close',
	'common.retry': 'Retry',

	// Common status — document save status, shown in tabs and the file tree
	'common.status.unsaved': 'Unsaved',
	'common.status.conflicted': 'Conflicted',
	'common.status.invalid': 'Invalid',

	// Tab bar
	'tab.close.ariaLabel': 'Close {name}',

	// File tree — context-menu commands
	'fileTree.command.new': 'New',
	'fileTree.command.file': 'File',
	'fileTree.command.folder': 'Folder',
	'fileTree.command.rename': 'Rename',
	'fileTree.command.delete': 'Delete',
	'fileTree.command.copyPath': 'Copy path',

	// File tree — file-system action labels (action-bar tooltips, dialog titles)
	'fileTree.action.createFile.label': 'Create File',
	'fileTree.action.createFolder.label': 'Create Folder',
	'fileTree.action.move.label': 'Move',

	// File tree — UI command labels (action-bar tooltips)
	'fileTree.uiCommand.expandNode.label': 'Expand All',
	'fileTree.uiCommand.collapseNode.label': 'Collapse All',
	'fileTree.uiCommand.locateActiveFile.label': 'Locate File',

	// File tree — save command labels (action-bar tooltips)
	'fileTree.saveCommand.save.label': 'Save',
	'fileTree.saveCommand.saveAll.label': 'Save All',

	// File tree — notification titles (in-editor prompts)
	'fileTree.notification.copyFailed': 'Copy failed',
	'fileTree.notification.pathCopied': 'Path copied',
	'fileTree.notification.actionFailed': 'Action failed',
	'fileTree.notification.saveFailed': 'Save failed',

	// File tree — error content (notifications and dialogs; resolved from error kind)
	'fileTree.error.actionDisabled': 'This action is not available right now.',
	'fileTree.error.missingSelection': 'No item is selected.',
	'fileTree.error.missingNode': 'The selected item no longer exists.',
	'fileTree.error.missingName': 'A name is required.',
	'fileTree.error.permissionDenied': 'You do not have permission to do that.',
	'fileTree.error.invalidTarget': 'That is not a valid destination.',
	'fileTree.error.fileSystem': 'A file system error occurred.',
	'fileTree.error.nameExists': 'A file or folder named "{name}" already exists.',
	'fileTree.error.unsavedDraft': 'This file has unsaved changes.',
	'fileTree.error.missingActiveFile': 'No file is currently open.',
	'fileTree.error.targetNotFolder': 'The target is not a folder.',
	'fileTree.error.alreadyExpanded': 'The folder is already expanded.',
	'fileTree.error.alreadyCollapsed': 'The folder is already collapsed.',
	'fileTree.error.missingTarget': 'No save target is specified.',
	'fileTree.error.targetNotFile': 'The target is not a file.',
	'fileTree.error.nothingToSave': 'There is nothing to save.',
	'fileTree.error.saveFailed': 'Could not save the file.',

	// Side bar
	'sideBar.search.placeholder': 'Search',
	'sideBar.collapse': 'Collapse Sidebar',
	'sideBar.expand': 'Expand Sidebar',

	// Delete dialog
	'dialog.delete.warning': 'This action cannot be undone.',

	// Name-input dialog
	'dialog.nameInput.nameLabel': 'Name',
	'dialog.nameInput.placeholder': 'Enter name...',

	// Conflict-resolution prompt
	'prompt.conflict.title': 'File changed on disk',
	'prompt.conflict.body': '{fileName} changed on disk since you opened it.',
	'prompt.conflict.reload': 'Reload from disk',
	'prompt.conflict.overwrite': 'Overwrite disk',

	// Conflict-resolution failure messages (resolved from the resolution error kind)
	'prompt.conflict.notFound': 'Document is no longer open.',
	'prompt.conflict.staleRevision': 'File changed again on disk — try again.',
	'prompt.conflict.notConflicted': 'File is no longer conflicted.',
	'prompt.conflict.invalid': 'File no longer exists on disk.',
	'prompt.conflict.readOnly': 'File is read-only.',
	'prompt.conflict.writeFailed': 'Could not write to disk.',
	'prompt.conflict.readFailed': 'Could not read from disk.',
	'prompt.conflict.disposed': 'Document was closed.',

	// Invalid-document prompt
	'prompt.invalidDoc.title': 'File no longer exists',
	'prompt.invalidDoc.body': '{fileName} was removed from disk.',
	'prompt.invalidDoc.close': 'Close file',

	// Invalid-document failure messages (resolved from the close error kind)
	'prompt.invalidDoc.staleRevision': 'Document state changed — try again.',
	'prompt.invalidDoc.notInvalid': 'Document is no longer invalid.',
	'prompt.invalidDoc.closeFailed': 'Could not close the document.',
	'prompt.invalidDoc.disposed': 'Editor was closed.',

	// Close-intent failure notification
	'prompt.closeFailure.unsavedDraft.title': 'Unsaved changes',
	'prompt.closeFailure.unsavedDraft.content': 'Save or discard before closing.',

	// Prompt notification bar
	'prompt.notificationBar.hidden': '{count} hidden',

	// Breadcrumb
	'breadcrumb.ariaLabel': 'breadcrumb',
	'breadcrumb.more': 'More'
} as const;

export type EditorMessageKey = keyof typeof en;
