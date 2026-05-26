import type { FileSystemPath } from '$lib/core/file-system/domain/file-system-models';

/**
 * Builds workspace-scoped file URIs from a FileSystem path. The namespace
 * (prefix) is per-workspace so multiple workspace instances coexist without
 * Monaco URI collisions. Sole source of truth for the URI convention —
 * consumed by DocumentRecordFactory (initial URI) and SavableEditorDocument
 * (URI rebind on rename/move).
 */
export interface IFileURIBuilder {
	build(path: FileSystemPath): string;
}
