import type { EditorMessageCatalog } from '$lib/core/localization/localization-models';

// Spanish overlay: omitted members fall back to English.
export const es: EditorMessageCatalog = {
	commonCancel: 'Cancelar',
	commonClose: 'Cerrar',
	commonRetry: 'Reintentar',

	commonStatusUnsaved: 'Sin guardar',
	commonStatusConflicted: 'En conflicto',
	commonStatusInvalid: 'No válido',

	tabCloseAriaLabel: (params: { readonly name: string }): string => `Cerrar ${params.name}`,

	fileTreeCommandNew: 'Nuevo',
	fileTreeCommandFile: 'Archivo',
	fileTreeCommandFolder: 'Carpeta',
	fileTreeCommandRename: 'Cambiar nombre',
	fileTreeCommandDelete: 'Eliminar',
	fileTreeCommandCopyPath: 'Copiar ruta',

	fileTreeActionCreateFileLabel: 'Crear archivo',
	fileTreeActionCreateFolderLabel: 'Crear carpeta',
	fileTreeActionMoveLabel: 'Mover',

	fileTreeUiCommandExpandNodeLabel: 'Expandir todo',
	fileTreeUiCommandCollapseNodeLabel: 'Contraer todo',
	fileTreeUiCommandLocateActiveFileLabel: 'Localizar archivo',

	fileTreeSaveCommandSaveLabel: 'Guardar',
	fileTreeSaveCommandSaveAllLabel: 'Guardar todo',

	fileTreeNotificationCopyFailed: 'Error al copiar',
	fileTreeNotificationPathCopied: 'Ruta copiada',
	fileTreeNotificationActionFailed: 'Error en la acción',
	fileTreeNotificationSaveFailed: 'Error al guardar',

	fileTreeErrorActionDisabled: 'Esta acción no está disponible en este momento.',
	fileTreeErrorMissingSelection: 'No hay ningún elemento seleccionado.',
	fileTreeErrorMissingNode: 'El elemento seleccionado ya no existe.',
	fileTreeErrorMissingName: 'Se requiere un nombre.',
	fileTreeErrorPermissionDenied: 'No tienes permiso para hacer eso.',
	fileTreeErrorInvalidTarget: 'Ese no es un destino válido.',
	fileTreeErrorFileSystem: 'Se produjo un error del sistema de archivos.',
	fileTreeErrorNameExists: (params: { readonly name: string }): string =>
		`Ya existe un archivo o carpeta con el nombre "${params.name}".`,
	fileTreeErrorUnsavedDraft: 'Este archivo tiene cambios sin guardar.',
	fileTreeErrorMissingActiveFile: 'No hay ningún archivo abierto actualmente.',
	fileTreeErrorTargetNotFolder: 'El destino no es una carpeta.',
	fileTreeErrorAlreadyExpanded: 'La carpeta ya está expandida.',
	fileTreeErrorAlreadyCollapsed: 'La carpeta ya está contraída.',
	fileTreeErrorMissingTarget: 'No se ha especificado ningún destino de guardado.',
	fileTreeErrorTargetNotFile: 'El destino no es un archivo.',
	fileTreeErrorNothingToSave: 'No hay nada que guardar.',
	fileTreeErrorSaveFailed: 'No se pudo guardar el archivo.',

	sideBarSearchPlaceholder: 'Buscar',
	sideBarCollapse: 'Contraer barra lateral',
	sideBarExpand: 'Expandir barra lateral',

	dialogDeleteWarning: 'Esta acción no se puede deshacer.',

	dialogNameInputNameLabel: 'Nombre',
	dialogNameInputPlaceholder: 'Escribe un nombre...',

	promptConflictTitle: 'El archivo cambió en el disco',
	promptConflictBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} cambió en el disco desde que lo abriste.`,
	promptConflictReload: 'Volver a cargar desde el disco',
	promptConflictOverwrite: 'Sobrescribir el disco',

	promptConflictNotFound: 'El documento ya no está abierto.',
	promptConflictStaleRevision: 'El archivo volvió a cambiar en el disco: inténtalo de nuevo.',
	promptConflictNotConflicted: 'El archivo ya no está en conflicto.',
	promptConflictInvalid: 'El archivo ya no existe en el disco.',
	promptConflictReadOnly: 'El archivo es de solo lectura.',
	promptConflictWriteFailed: 'No se pudo escribir en el disco.',
	promptConflictReadFailed: 'No se pudo leer del disco.',
	promptConflictDisposed: 'El documento se cerró.',

	promptInvalidDocTitle: 'El archivo ya no existe',
	promptInvalidDocBody: (params: { readonly fileName: string }): string =>
		`${params.fileName} se eliminó del disco.`,
	promptInvalidDocClose: 'Cerrar archivo',

	promptInvalidDocStaleRevision: 'El estado del documento cambió: inténtalo de nuevo.',
	promptInvalidDocNotInvalid: 'El documento ya no es no válido.',
	promptInvalidDocCloseFailed: 'No se pudo cerrar el documento.',
	promptInvalidDocDisposed: 'El editor se cerró.',

	promptCloseFailureUnsavedDraftTitle: 'Cambios sin guardar',
	promptCloseFailureUnsavedDraftContent: 'Guarda o descarta los cambios antes de cerrar.',

	promptNotificationBarHidden: (params: { readonly count: number }): string =>
		`${params.count} ocultas`,

	breadcrumbAriaLabel: 'ruta de navegación',
	breadcrumbMore: 'Más',

	sessionErrorHydrationFailed: 'No se pudo hidratar la sesión del editor.',
	sessionErrorFileSystemLoadFailed: (params: { readonly cause: string }): string =>
		`No se pudo cargar el sistema de archivos: ${params.cause}`,
	sessionErrorMonacoLoadFailed: (params: { readonly cause: string }): string =>
		`No se pudo cargar el motor Monaco: ${params.cause}`,

	persistenceErrorImportInvalidFormat: 'Los datos proporcionados no son un archivo zip válido.',
	persistenceErrorImportReadFailed: 'No se pudo leer el contenido del archivo zip.',
	persistenceErrorImportStructureInvalid:
		'La estructura del archivo no se corresponde con el sistema de archivos.',
	persistenceErrorExportNodeNotFound:
		'No se encontró un elemento referenciado en el sistema de archivos.',
	persistenceErrorExportEmptySelection: 'No hay nada que exportar.',
	persistenceErrorExportCompressionFailed: 'No se pudo crear el archivo zip.',
	persistenceErrorExportFormattingFailed: 'No se pudo formatear el contenido del archivo.'
};
