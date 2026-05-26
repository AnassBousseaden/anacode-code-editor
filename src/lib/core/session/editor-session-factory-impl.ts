import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import { FileSystemService } from '$lib/core/file-system/services/file-system-service-impl';
import { FileSystemCommandFactory } from '$lib/core/file-system/services/command-factory/file-system-command-factory-impl';
import type {
	FileSystemMapReadonly,
	IFileSystemEngine,
	OperationError
} from '$lib/core/file-system/domain/file-system-models';
import { FileSystemLoader } from '$lib/core/file-system/loader/file-system-loader';
import type {
	IFileSystemZipImporter,
	ImportedFileSystemState,
	ZipImportError
} from '$lib/core/file-system/persistance/import/file-system-import';
import type { IEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
import { EditorUserSpaceStateService } from '$lib/core/state/user-space/editor-user-space-state-impl';
import { EditorWorkspaceV2 } from '$lib/core/workspace/editor-workspace-v2-impl';
import { failure, success, type Result } from '$lib/core/shared/models-utils';

import type {
	CreateEditorSessionError,
	CreateEditorSessionFromZipError,
	IEditorSession,
	IEditorSessionFactory
} from '$lib/core/session/editor-session';
import {
	CreateEditorSessionErrorKind,
	CreateEditorSessionErrorMessages
} from '$lib/core/session/editor-session';
import { EditorSession } from '$lib/core/session/editor-session-impl';

export class EditorSessionFactory implements IEditorSessionFactory {
	private readonly zipImporter: IFileSystemZipImporter;

	public constructor(zipImporter: IFileSystemZipImporter) {
		this.zipImporter = zipImporter;
	}

	public async createFromFileSystem(
		fileSystemService: IFileSystemService,
		editorConfigService: IEditorConfigurationService
	): Promise<Result<IEditorSession, CreateEditorSessionError>> {
		const workspace: EditorWorkspaceV2 = new EditorWorkspaceV2(
			fileSystemService,
			editorConfigService
		);
		await workspace.initialize();
		const session: IEditorSession = new EditorSession(workspace);
		return success(session);
	}

	public async createFromFileSystemMap(
		fileSystemMap: FileSystemMapReadonly,
		editorConfigService: IEditorConfigurationService
	): Promise<Result<IEditorSession, CreateEditorSessionError>> {
		const loadResult: Result<IFileSystemEngine, OperationError> =
			await FileSystemLoader.load(fileSystemMap);
		if (!loadResult.ok) {
			return failure(this.buildFileSystemLoadError(loadResult.error.message));
		}

		const engine: IFileSystemEngine = loadResult.value;
		const userSpaceStateService: EditorUserSpaceStateService = new EditorUserSpaceStateService();
		const commandFactory: FileSystemCommandFactory = new FileSystemCommandFactory(
			userSpaceStateService
		);
		const fileSystemService: IFileSystemService = new FileSystemService(engine, commandFactory);

		const workspace: EditorWorkspaceV2 = new EditorWorkspaceV2(
			fileSystemService,
			editorConfigService,
			userSpaceStateService
		);
		await workspace.initialize();

		const session: IEditorSession = new EditorSession(workspace);
		return success(session);
	}

	public async createFromZip(
		zipData: Blob,
		editorConfigService: IEditorConfigurationService
	): Promise<Result<IEditorSession, CreateEditorSessionFromZipError>> {
		const importResult: Result<ImportedFileSystemState, ZipImportError> =
			await this.zipImporter.import(zipData);
		if (!importResult.ok) {
			return failure(importResult.error);
		}

		return this.createFromFileSystemMap(importResult.value.fileSystemMap, editorConfigService);
	}

	private buildFileSystemLoadError(causeMessage: string): CreateEditorSessionError {
		const baseMessage: string =
			CreateEditorSessionErrorMessages[CreateEditorSessionErrorKind.FILE_SYSTEM_LOAD_FAILED];
		return {
			kind: CreateEditorSessionErrorKind.FILE_SYSTEM_LOAD_FAILED,
			message: `${baseMessage}: ${causeMessage}`
		};
	}
}
