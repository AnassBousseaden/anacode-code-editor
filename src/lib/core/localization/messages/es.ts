import type { EditorMessageCatalog } from '$lib/core/localization/localization-models';

/**
 * Spanish overlay catalog.
 *
 * A `Partial` overlay over {@link en}: only translated keys need appear; any
 * omitted key falls back to English at resolution time. Empty for now —
 * translations are seeded in later phases.
 */
export const es: EditorMessageCatalog = {
	// Common — shared words reused across screens
	'common.cancel': 'Cancelar',
	'common.close': 'Cerrar',
	'common.retry': 'Reintentar',

	// Common status — document save status, shown in tabs and the file tree
	'common.status.unsaved': 'Sin guardar',
	'common.status.conflicted': 'En conflicto',
	'common.status.invalid': 'No válido',

	// Tab bar
	'tab.close.ariaLabel': 'Cerrar {name}',

	// File tree — context-menu commands
	'fileTree.command.new': 'Nuevo',
	'fileTree.command.file': 'Archivo',
	'fileTree.command.folder': 'Carpeta',
	'fileTree.command.rename': 'Cambiar nombre',
	'fileTree.command.delete': 'Eliminar',
	'fileTree.command.copyPath': 'Copiar ruta',

	// File tree — file-system action labels (action-bar tooltips, dialog titles)
	'fileTree.action.createFile.label': 'Crear archivo',
	'fileTree.action.createFolder.label': 'Crear carpeta',
	'fileTree.action.move.label': 'Mover',

	// File tree — UI command labels (action-bar tooltips)
	'fileTree.uiCommand.expandNode.label': 'Expandir todo',
	'fileTree.uiCommand.collapseNode.label': 'Contraer todo',
	'fileTree.uiCommand.locateActiveFile.label': 'Localizar archivo',

	// File tree — save command labels (action-bar tooltips)
	'fileTree.saveCommand.save.label': 'Guardar',
	'fileTree.saveCommand.saveAll.label': 'Guardar todo',

	// File tree — notification titles (in-editor prompts)
	'fileTree.notification.copyFailed': 'Error al copiar',
	'fileTree.notification.pathCopied': 'Ruta copiada',
	'fileTree.notification.actionFailed': 'Error en la acción',
	'fileTree.notification.saveFailed': 'Error al guardar',

	// File tree — error content (notifications and dialogs; resolved from error kind)
	'fileTree.error.actionDisabled': 'Esta acción no está disponible en este momento.',
	'fileTree.error.missingSelection': 'No hay ningún elemento seleccionado.',
	'fileTree.error.missingNode': 'El elemento seleccionado ya no existe.',
	'fileTree.error.missingName': 'Se requiere un nombre.',
	'fileTree.error.permissionDenied': 'No tienes permiso para hacer eso.',
	'fileTree.error.invalidTarget': 'Ese no es un destino válido.',
	'fileTree.error.fileSystem': 'Se produjo un error del sistema de archivos.',
	'fileTree.error.nameExists': 'Ya existe un archivo o carpeta con el nombre "{name}".',
	'fileTree.error.unsavedDraft': 'Este archivo tiene cambios sin guardar.',
	'fileTree.error.missingActiveFile': 'No hay ningún archivo abierto actualmente.',
	'fileTree.error.targetNotFolder': 'El destino no es una carpeta.',
	'fileTree.error.alreadyExpanded': 'La carpeta ya está expandida.',
	'fileTree.error.alreadyCollapsed': 'La carpeta ya está contraída.',
	'fileTree.error.missingTarget': 'No se ha especificado ningún destino de guardado.',
	'fileTree.error.targetNotFile': 'El destino no es un archivo.',
	'fileTree.error.nothingToSave': 'No hay nada que guardar.',
	'fileTree.error.saveFailed': 'No se pudo guardar el archivo.',

	// Side bar
	'sideBar.search.placeholder': 'Buscar',
	'sideBar.collapse': 'Contraer barra lateral',
	'sideBar.expand': 'Expandir barra lateral',

	// Delete dialog
	'dialog.delete.warning': 'Esta acción no se puede deshacer.',

	// Name-input dialog
	'dialog.nameInput.nameLabel': 'Nombre',
	'dialog.nameInput.placeholder': 'Escribe un nombre...',

	// Conflict-resolution prompt
	'prompt.conflict.title': 'El archivo cambió en el disco',
	'prompt.conflict.body': '{fileName} cambió en el disco desde que lo abriste.',
	'prompt.conflict.reload': 'Volver a cargar desde el disco',
	'prompt.conflict.overwrite': 'Sobrescribir el disco',

	// Conflict-resolution failure messages (resolved from the resolution error kind)
	'prompt.conflict.notFound': 'El documento ya no está abierto.',
	'prompt.conflict.staleRevision': 'El archivo volvió a cambiar en el disco: inténtalo de nuevo.',
	'prompt.conflict.notConflicted': 'El archivo ya no está en conflicto.',
	'prompt.conflict.invalid': 'El archivo ya no existe en el disco.',
	'prompt.conflict.readOnly': 'El archivo es de solo lectura.',
	'prompt.conflict.writeFailed': 'No se pudo escribir en el disco.',
	'prompt.conflict.readFailed': 'No se pudo leer del disco.',
	'prompt.conflict.disposed': 'El documento se cerró.',

	// Invalid-document prompt
	'prompt.invalidDoc.title': 'El archivo ya no existe',
	'prompt.invalidDoc.body': '{fileName} se eliminó del disco.',
	'prompt.invalidDoc.close': 'Cerrar archivo',

	// Invalid-document failure messages (resolved from the close error kind)
	'prompt.invalidDoc.staleRevision': 'El estado del documento cambió: inténtalo de nuevo.',
	'prompt.invalidDoc.notInvalid': 'El documento ya no es no válido.',
	'prompt.invalidDoc.closeFailed': 'No se pudo cerrar el documento.',
	'prompt.invalidDoc.disposed': 'El editor se cerró.',

	// Close-intent failure notification
	'prompt.closeFailure.unsavedDraft.title': 'Cambios sin guardar',
	'prompt.closeFailure.unsavedDraft.content': 'Guarda o descarta los cambios antes de cerrar.',

	// Prompt notification bar
	'prompt.notificationBar.hidden': '{count} ocultas',

	// Breadcrumb
	'breadcrumb.ariaLabel': 'ruta de navegación',
	'breadcrumb.more': 'Más'
};
