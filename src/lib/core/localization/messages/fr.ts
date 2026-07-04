import type { EditorMessageCatalog } from '$lib/core/localization/localization-models';

// French overlay: omitted members fall back to English.
export const fr: EditorMessageCatalog = {
	commonCancel: 'Annuler',
	commonClose: 'Fermer',
	commonRetry: 'Réessayer',

	commonStatusUnsaved: 'Non enregistré',
	commonStatusConflicted: 'En conflit',
	commonStatusInvalid: 'Non valide',

	tabCloseAriaLabel: (params: { readonly name: string }): string => `Fermer ${params.name}`,

	fileTreeCommandNew: 'Nouveau',
	fileTreeCommandFile: 'Fichier',
	fileTreeCommandFolder: 'Dossier',
	fileTreeCommandRename: 'Renommer',
	fileTreeCommandDelete: 'Supprimer',
	fileTreeCommandCopyPath: 'Copier le chemin',

	fileTreeActionCreateFileLabel: 'Créer un fichier',
	fileTreeActionCreateFolderLabel: 'Créer un dossier',
	fileTreeActionMoveLabel: 'Déplacer',

	fileTreeUiCommandExpandNodeLabel: 'Tout développer',
	fileTreeUiCommandCollapseNodeLabel: 'Tout réduire',
	fileTreeUiCommandLocateActiveFileLabel: 'Localiser le fichier',

	fileTreeSaveCommandSaveLabel: 'Enregistrer',
	fileTreeSaveCommandSaveAllLabel: 'Tout enregistrer',

	fileTreeNotificationCopyFailed: 'Échec de la copie',
	fileTreeNotificationPathCopied: 'Chemin copié',
	fileTreeNotificationActionFailed: 'Échec de l’action',
	fileTreeNotificationSaveFailed: 'Échec de l’enregistrement',

	fileTreeErrorActionDisabled: 'Cette action n’est pas disponible pour le moment.',
	fileTreeErrorMissingSelection: 'Aucun élément n’est sélectionné.',
	fileTreeErrorMissingNode: 'L’élément sélectionné n’existe plus.',
	fileTreeErrorMissingName: 'Un nom est requis.',
	fileTreeErrorPermissionDenied: 'Vous n’avez pas l’autorisation d’effectuer cette action.',
	fileTreeErrorInvalidTarget: 'Ce n’est pas une destination valide.',
	fileTreeErrorFileSystem: 'Une erreur du système de fichiers s’est produite.',
	fileTreeErrorNameExists: (params: { readonly name: string }): string =>
		`Un fichier ou dossier nommé « ${params.name} » existe déjà.`,
	fileTreeErrorUnsavedDraft: 'Ce fichier contient des modifications non enregistrées.',
	fileTreeErrorMissingActiveFile: 'Aucun fichier n’est actuellement ouvert.',
	fileTreeErrorTargetNotFolder: 'La cible n’est pas un dossier.',
	fileTreeErrorAlreadyExpanded: 'Le dossier est déjà développé.',
	fileTreeErrorAlreadyCollapsed: 'Le dossier est déjà réduit.',
	fileTreeErrorMissingTarget: 'Aucune cible d’enregistrement n’est spécifiée.',
	fileTreeErrorTargetNotFile: 'La cible n’est pas un fichier.',
	fileTreeErrorNothingToSave: 'Il n’y a rien à enregistrer.',
	fileTreeErrorSaveFailed: 'Impossible d’enregistrer le fichier.',

	sideBarSearchPlaceholder: 'Rechercher',
	sideBarCollapse: 'Réduire la barre latérale',
	sideBarExpand: 'Développer la barre latérale',

	dialogDeleteWarning: 'Cette action est irréversible.',

	dialogNameInputNameLabel: 'Nom',
	dialogNameInputPlaceholder: 'Saisir un nom...',

	promptConflictTitle: 'Fichier modifié sur le disque',
	promptConflictBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} a été modifié sur le disque depuis son ouverture.`,
	promptConflictReload: 'Recharger depuis le disque',
	promptConflictOverwrite: 'Écraser le disque',

	promptConflictNotFound: 'Le document n’est plus ouvert.',
	promptConflictStaleRevision: 'Le fichier a de nouveau été modifié sur le disque — réessayez.',
	promptConflictNotConflicted: 'Le fichier n’est plus en conflit.',
	promptConflictInvalid: 'Le fichier n’existe plus sur le disque.',
	promptConflictReadOnly: 'Le fichier est en lecture seule.',
	promptConflictWriteFailed: 'Impossible d’écrire sur le disque.',
	promptConflictReadFailed: 'Impossible de lire depuis le disque.',
	promptConflictDisposed: 'Le document a été fermé.',

	promptInvalidDocTitle: 'Le fichier n’existe plus',
	promptInvalidDocBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} a été supprimé du disque.`,
	promptInvalidDocClose: 'Fermer le fichier',

	promptInvalidDocStaleRevision: 'L’état du document a changé — réessayez.',
	promptInvalidDocNotInvalid: 'Le document n’est plus non valide.',
	promptInvalidDocCloseFailed: 'Impossible de fermer le document.',
	promptInvalidDocDisposed: 'L’éditeur a été fermé.',

	promptCloseFailureUnsavedDraftTitle: 'Modifications non enregistrées',
	promptCloseFailureUnsavedDraftContent:
		'Enregistrez ou ignorez les modifications avant de fermer.',

	promptNotificationBarHidden: (params: { readonly count: number }): string =>
		`${params.count} masquées`,

	breadcrumbAriaLabel: 'fil d’Ariane',
	breadcrumbMore: 'Plus',

	sessionErrorHydrationFailed: 'Échec de l’hydratation de la session d’édition.',
	sessionErrorFileSystemLoadFailed: (params: { readonly cause: string }): string =>
		`Échec du chargement du système de fichiers : ${params.cause}`,
	sessionErrorMonacoLoadFailed: (params: { readonly cause: string }): string =>
		`Échec du chargement du moteur Monaco : ${params.cause}`,

	persistenceErrorImportInvalidFormat: 'Les données fournies ne sont pas une archive zip valide.',
	persistenceErrorImportReadFailed: 'Échec de la lecture du contenu de l’archive.',
	persistenceErrorImportStructureInvalid:
		'La structure de l’archive ne correspond pas au système de fichiers.',
	persistenceErrorExportNodeNotFound:
		'Un élément référencé est introuvable dans le système de fichiers.',
	persistenceErrorExportEmptySelection: 'Il n’y a rien à exporter.',
	persistenceErrorExportCompressionFailed: 'Échec de la création de l’archive zip.',
	persistenceErrorExportFormattingFailed: 'Échec du formatage du contenu du fichier.'
};
