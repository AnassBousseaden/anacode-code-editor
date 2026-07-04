import {en} from '$lib/core/localization/messages/en';
import {fr} from '$lib/core/localization/messages/fr';
import {es} from '$lib/core/localization/messages/es';

export enum EditorLocale {
	EN = 'en',
	FR = 'fr',
	ES = 'es'
}

/**
 * Every user-facing string in the editor, as a typed member: plain `string`
 * for static text, a function with typed params for interpolated text.
 */
export interface EditorMessages {
	// Common — shared words reused across screens
	readonly commonCancel: string;
	readonly commonClose: string;
	readonly commonRetry: string;

	// Common status — document save status, shown in tabs and the file tree
	readonly commonStatusUnsaved: string;
	readonly commonStatusConflicted: string;
	readonly commonStatusInvalid: string;

	// Tab bar
	tabCloseAriaLabel(params: { readonly name: string }): string;

	// File tree — context-menu commands
	readonly fileTreeCommandNew: string;
	readonly fileTreeCommandFile: string;
	readonly fileTreeCommandFolder: string;
	readonly fileTreeCommandRename: string;
	readonly fileTreeCommandDelete: string;
	readonly fileTreeCommandCopyPath: string;

	// File tree — file-system action labels (action-bar tooltips, dialog titles)
	readonly fileTreeActionCreateFileLabel: string;
	readonly fileTreeActionCreateFolderLabel: string;
	readonly fileTreeActionMoveLabel: string;

	// File tree — UI command labels (action-bar tooltips)
	readonly fileTreeUiCommandExpandNodeLabel: string;
	readonly fileTreeUiCommandCollapseNodeLabel: string;
	readonly fileTreeUiCommandLocateActiveFileLabel: string;

	// File tree — save command labels (action-bar tooltips)
	readonly fileTreeSaveCommandSaveLabel: string;
	readonly fileTreeSaveCommandSaveAllLabel: string;

	// File tree — notification titles (in-editor prompts)
	readonly fileTreeNotificationCopyFailed: string;
	readonly fileTreeNotificationPathCopied: string;
	readonly fileTreeNotificationActionFailed: string;
	readonly fileTreeNotificationSaveFailed: string;

	// File tree — error content (notifications and dialogs)
	readonly fileTreeErrorActionDisabled: string;
	readonly fileTreeErrorMissingSelection: string;
	readonly fileTreeErrorMissingNode: string;
	readonly fileTreeErrorMissingName: string;
	readonly fileTreeErrorPermissionDenied: string;
	readonly fileTreeErrorInvalidTarget: string;
	readonly fileTreeErrorFileSystem: string;

	fileTreeErrorNameExists(params: { readonly name: string }): string;

	readonly fileTreeErrorUnsavedDraft: string;
	readonly fileTreeErrorMissingActiveFile: string;
	readonly fileTreeErrorTargetNotFolder: string;
	readonly fileTreeErrorAlreadyExpanded: string;
	readonly fileTreeErrorAlreadyCollapsed: string;
	readonly fileTreeErrorMissingTarget: string;
	readonly fileTreeErrorTargetNotFile: string;
	readonly fileTreeErrorNothingToSave: string;
	readonly fileTreeErrorSaveFailed: string;

	// Side bar
	readonly sideBarSearchPlaceholder: string;
	readonly sideBarCollapse: string;
	readonly sideBarExpand: string;

	// Delete dialog
	readonly dialogDeleteWarning: string;

	// Name-input dialog
	readonly dialogNameInputNameLabel: string;
	readonly dialogNameInputPlaceholder: string;

	// Conflict-resolution prompt
	readonly promptConflictTitle: string;

	promptConflictBody(params: { readonly fileName: string }): string;

	readonly promptConflictReload: string;
	readonly promptConflictOverwrite: string;

	// Conflict-resolution failure messages
	readonly promptConflictNotFound: string;
	readonly promptConflictStaleRevision: string;
	readonly promptConflictNotConflicted: string;
	readonly promptConflictInvalid: string;
	readonly promptConflictReadOnly: string;
	readonly promptConflictWriteFailed: string;
	readonly promptConflictReadFailed: string;
	readonly promptConflictDisposed: string;

	// Invalid-document prompt
	readonly promptInvalidDocTitle: string;

	promptInvalidDocBody(params: { readonly fileName: string }): string;

	readonly promptInvalidDocClose: string;

	// Invalid-document failure messages
	readonly promptInvalidDocStaleRevision: string;
	readonly promptInvalidDocNotInvalid: string;
	readonly promptInvalidDocCloseFailed: string;
	readonly promptInvalidDocDisposed: string;

	// Close-intent failure notification
	readonly promptCloseFailureUnsavedDraftTitle: string;
	readonly promptCloseFailureUnsavedDraftContent: string;

	// Prompt notification bar
	promptNotificationBarHidden(params: { readonly count: number }): string;

	// Breadcrumb
	readonly breadcrumbAriaLabel: string;
	readonly breadcrumbMore: string;

	// Session creation failures
	readonly sessionErrorHydrationFailed: string;

	sessionErrorFileSystemLoadFailed(params: { readonly cause: string }): string;

	sessionErrorMonacoLoadFailed(params: { readonly cause: string }): string;

	// Zip import/export failures
	readonly persistenceErrorImportInvalidFormat: string;
	readonly persistenceErrorImportReadFailed: string;
	readonly persistenceErrorImportStructureInvalid: string;
	readonly persistenceErrorExportNodeNotFound: string;
	readonly persistenceErrorExportEmptySelection: string;
	readonly persistenceErrorExportCompressionFailed: string;
	readonly persistenceErrorExportFormattingFailed: string;
}

export type EditorMessageCatalog = Partial<EditorMessages>;

export interface EditorLocalizationOptions {
	readonly locale?: EditorLocale;
	readonly overrides?: EditorMessageCatalog;
}

const LOCALE_CATALOGS: Readonly<
	Record<Exclude<EditorLocale, EditorLocale.EN>, EditorMessageCatalog>
> = {
	[EditorLocale.FR]: fr,
	[EditorLocale.ES]: es
};

// Precedence, highest last: English base → locale overlay → consumer overrides.
export function resolveEditorMessages(options?: EditorLocalizationOptions): EditorMessages {
	const localeCatalog: EditorMessageCatalog =
		options?.locale !== undefined && options.locale !== EditorLocale.EN
			? LOCALE_CATALOGS[options.locale]
			: {};
	const overrides: EditorMessageCatalog = options?.overrides ?? {};
	return Object.freeze({...en, ...localeCatalog, ...overrides});
}
