import type { IEditorWorkspaceV2 } from '$lib/core/workspace/editor-workspace-v2';
import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';
import type { IEditorIntentService } from '$lib/core/editor/intent/editor-intent-service';
import type { IFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';
import type { IEditorUserSpaceStateService } from '$lib/core/state/user-space/editor-user-space-state';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';
import type { ITabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
import type { IFileTreeProjection } from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { FileSystemMapReadonly } from '$lib/core/file-system/domain/file-system-models';
import type { IEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
import type { ZipImportError } from '$lib/core/file-system/persistance/import/file-system-import';
import type {
	EditorLocalizationOptions,
	EditorMessages
} from '$lib/core/localization/localization-models';
import type {
	IDisposable1,
	OperationFailure,
	Result
} from '$lib/core/shared/models-utils';

export interface IEditorSession extends IDisposable1 {
	readonly workspace: IEditorWorkspaceV2;
	readonly codeEditor: ICodeEditorComponentController;

	readonly intent: IEditorIntentService;
	readonly selection: IFileTreeSelectionIntent;
	readonly userSpaceState: IEditorUserSpaceStateService;
	readonly promptManager: IEditorPromptManager;
	readonly tabProjection: ITabProjectionService;
	readonly fileTreeProjection: IFileTreeProjection;
	readonly messages: EditorMessages;
}

export enum CreateEditorSessionErrorKind {
	HYDRATION_FAILED = 'HYDRATION_FAILED',
	FILE_SYSTEM_LOAD_FAILED = 'FILE_SYSTEM_LOAD_FAILED',
	MONACO_LOAD_FAILED = 'MONACO_LOAD_FAILED'
}

export type CreateEditorSessionError = OperationFailure<CreateEditorSessionErrorKind>;


export type CreateEditorSessionFromZipError = CreateEditorSessionError | ZipImportError;

export interface IEditorSessionFactory {
	createFromFileSystem(
		fileSystemService: IFileSystemService,
		editorConfigService: IEditorConfigurationService,
		localization?: EditorLocalizationOptions
	): Promise<Result<IEditorSession, CreateEditorSessionError>>;

	createFromFileSystemMap(
		fileSystemMap: FileSystemMapReadonly,
		editorConfigService: IEditorConfigurationService,
		localization?: EditorLocalizationOptions
	): Promise<Result<IEditorSession, CreateEditorSessionError>>;

	createFromZip(
		zipData: Blob,
		editorConfigService: IEditorConfigurationService,
		localization?: EditorLocalizationOptions
	): Promise<Result<IEditorSession, CreateEditorSessionFromZipError>>;
}
