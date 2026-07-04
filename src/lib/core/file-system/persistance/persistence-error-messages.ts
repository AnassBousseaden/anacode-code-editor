import type { EditorMessages } from '$lib/core/localization/localization-models';
import {
	ZipImportErrorKind,
	type ZipImportError
} from '$lib/core/file-system/persistance/import/file-system-import';
import {
	ZipExportErrorKind,
	type ZipExportError
} from '$lib/core/file-system/persistance/export/file-system-exporter';

export function resolveZipImportErrorContent(
	messages: EditorMessages,
	error: ZipImportError
): string {
	switch (error.kind) {
		case ZipImportErrorKind.INVALID_FORMAT:
			return messages.persistenceErrorImportInvalidFormat;
		case ZipImportErrorKind.READ_FAILED:
			return messages.persistenceErrorImportReadFailed;
		case ZipImportErrorKind.STRUCTURE_INVALID:
			return messages.persistenceErrorImportStructureInvalid;
	}
}

export function resolveZipExportErrorContent(
	messages: EditorMessages,
	error: ZipExportError
): string {
	switch (error.kind) {
		case ZipExportErrorKind.NODE_NOT_FOUND:
			return messages.persistenceErrorExportNodeNotFound;
		case ZipExportErrorKind.EMPTY_SELECTION:
			return messages.persistenceErrorExportEmptySelection;
		case ZipExportErrorKind.COMPRESSION_FAILED:
			return messages.persistenceErrorExportCompressionFailed;
		case ZipExportErrorKind.FORMATTING_FAILED:
			return messages.persistenceErrorExportFormattingFailed;
	}
}
