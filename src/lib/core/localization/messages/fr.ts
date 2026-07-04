import type { EditorMessageCatalog } from '$lib/core/localization/localization-models';

/**
 * French overlay catalog.
 *
 * A `Partial` overlay over {@link en}: only translated keys need appear; any
 * omitted key falls back to English at resolution time. Empty for now —
 * translations are seeded in later phases.
 */
export const fr: EditorMessageCatalog = {
	// Common — shared words reused across screens
	'common.cancel': 'Annuler',
	'common.close': 'Fermer',
	'common.retry': 'Réessayer',

	// Common status — document save status, shown in tabs and the file tree
	'common.status.unsaved': 'Non enregistré',
	'common.status.conflicted': 'En conflit',
	'common.status.invalid': 'Non valide',

	// Tab bar
	'tab.close.ariaLabel': 'Fermer {name}',

	// File tree — context-menu commands
	'fileTree.command.new': 'Nouveau',
	'fileTree.command.file': 'Fichier',
	'fileTree.command.folder': 'Dossier',
	'fileTree.command.rename': 'Renommer',
	'fileTree.command.delete': 'Supprimer',
	'fileTree.command.copyPath': 'Copier le chemin',

	// File tree — file-system action labels (action-bar tooltips, dialog titles)
	'fileTree.action.createFile.label': 'Créer un fichier',
	'fileTree.action.createFolder.label': 'Créer un dossier',
	'fileTree.action.move.label': 'Déplacer',

	// File tree — UI command labels (action-bar tooltips)
	'fileTree.uiCommand.expandNode.label': 'Tout développer',
	'fileTree.uiCommand.collapseNode.label': 'Tout réduire',
	'fileTree.uiCommand.locateActiveFile.label': 'Localiser le fichier',

	// File tree — save command labels (action-bar tooltips)
	'fileTree.saveCommand.save.label': 'Enregistrer',
	'fileTree.saveCommand.saveAll.label': 'Tout enregistrer',

	// File tree — notification titles (in-editor prompts)
	'fileTree.notification.copyFailed': 'Échec de la copie',
	'fileTree.notification.pathCopied': 'Chemin copié',
	'fileTree.notification.actionFailed': 'Échec de l’action',
	'fileTree.notification.saveFailed': 'Échec de l’enregistrement',

	// File tree — error content (notifications and dialogs; resolved from error kind)
	'fileTree.error.actionDisabled': 'Cette action n’est pas disponible pour le moment.',
	'fileTree.error.missingSelection': 'Aucun élément n’est sélectionné.',
	'fileTree.error.missingNode': 'L’élément sélectionné n’existe plus.',
	'fileTree.error.missingName': 'Un nom est requis.',
	'fileTree.error.permissionDenied': 'Vous n’avez pas l’autorisation d’effectuer cette action.',
	'fileTree.error.invalidTarget': 'Ce n’est pas une destination valide.',
	'fileTree.error.fileSystem': 'Une erreur du système de fichiers s’est produite.',
	'fileTree.error.nameExists': 'Un fichier ou dossier nommé « {name} » existe déjà.',
	'fileTree.error.unsavedDraft': 'Ce fichier contient des modifications non enregistrées.',
	'fileTree.error.missingActiveFile': 'Aucun fichier n’est actuellement ouvert.',
	'fileTree.error.targetNotFolder': 'La cible n’est pas un dossier.',
	'fileTree.error.alreadyExpanded': 'Le dossier est déjà développé.',
	'fileTree.error.alreadyCollapsed': 'Le dossier est déjà réduit.',
	'fileTree.error.missingTarget': 'Aucune cible d’enregistrement n’est spécifiée.',
	'fileTree.error.targetNotFile': 'La cible n’est pas un fichier.',
	'fileTree.error.nothingToSave': 'Il n’y a rien à enregistrer.',
	'fileTree.error.saveFailed': 'Impossible d’enregistrer le fichier.',

	// Side bar
	'sideBar.search.placeholder': 'Rechercher',
	'sideBar.collapse': 'Réduire la barre latérale',
	'sideBar.expand': 'Développer la barre latérale',

	// Delete dialog
	'dialog.delete.warning': 'Cette action est irréversible.',

	// Name-input dialog
	'dialog.nameInput.nameLabel': 'Nom',
	'dialog.nameInput.placeholder': 'Saisir un nom...',

	// Conflict-resolution prompt
	'prompt.conflict.title': 'Fichier modifié sur le disque',
	'prompt.conflict.body': '{fileName} a été modifié sur le disque depuis son ouverture.',
	'prompt.conflict.reload': 'Recharger depuis le disque',
	'prompt.conflict.overwrite': 'Écraser le disque',

	// Conflict-resolution failure messages (resolved from the resolution error kind)
	'prompt.conflict.notFound': 'Le document n’est plus ouvert.',
	'prompt.conflict.staleRevision': 'Le fichier a de nouveau été modifié sur le disque — réessayez.',
	'prompt.conflict.notConflicted': 'Le fichier n’est plus en conflit.',
	'prompt.conflict.invalid': 'Le fichier n’existe plus sur le disque.',
	'prompt.conflict.readOnly': 'Le fichier est en lecture seule.',
	'prompt.conflict.writeFailed': 'Impossible d’écrire sur le disque.',
	'prompt.conflict.readFailed': 'Impossible de lire depuis le disque.',
	'prompt.conflict.disposed': 'Le document a été fermé.',

	// Invalid-document prompt
	'prompt.invalidDoc.title': 'Le fichier n’existe plus',
	'prompt.invalidDoc.body': '{fileName} a été supprimé du disque.',
	'prompt.invalidDoc.close': 'Fermer le fichier',

	// Invalid-document failure messages (resolved from the close error kind)
	'prompt.invalidDoc.staleRevision': 'L’état du document a changé — réessayez.',
	'prompt.invalidDoc.notInvalid': 'Le document n’est plus non valide.',
	'prompt.invalidDoc.closeFailed': 'Impossible de fermer le document.',
	'prompt.invalidDoc.disposed': 'L’éditeur a été fermé.',

	// Close-intent failure notification
	'prompt.closeFailure.unsavedDraft.title': 'Modifications non enregistrées',
	'prompt.closeFailure.unsavedDraft.content': 'Enregistrez ou ignorez les modifications avant de fermer.',

	// Prompt notification bar
	'prompt.notificationBar.hidden': '{count} masquées',

	// Breadcrumb
	'breadcrumb.ariaLabel': 'fil d’Ariane',
	'breadcrumb.more': 'Plus'
};
