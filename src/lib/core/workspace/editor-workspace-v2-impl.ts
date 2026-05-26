import { type Readable, writable, type Writable } from 'svelte/store';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IEditorPresentationService } from '$lib/core/code-editor/editor-orchestration-service';
import { EditorOrchestrationService } from '$lib/core/code-editor/editor-orchestration-service-impl';
import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';
import { CodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller-impl';
import { EditorAttachmentPort } from '$lib/core/code-editor/editor-attachment-port-impl';
import type { IConflictResolutionService } from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import { ConflictResolutionService } from '$lib/core/editor/conflict-resolution/conflict-resolution-service-impl';
import type { IInvalidDocumentService } from '$lib/core/editor/invalid-document/invalid-document-service';
import { InvalidDocumentService } from '$lib/core/editor/invalid-document/invalid-document-service-impl';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';
import { EditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager-impl';
import type {
	IEditorIntentCommands,
	IEditorIntentService,
	IObservableEditorIntentState
} from '$lib/core/editor/intent/editor-intent-service';
import { EditorIntentService } from '$lib/core/editor/intent/editor-intent-service-impl';
import type { IEditorViewStateRegistry } from '$lib/core/editor/view-state/editor-view-state-registry';
import { EditorViewStateRegistry } from '$lib/core/editor/view-state/editor-view-state-registry-impl';
import type { IEditorDocumentFactory } from '$lib/core/editor/document-factory/editor-document-factory-model';
import type { IDisposable1, Result } from '$lib/core/shared/models-utils';
import { success } from '$lib/core/shared/models-utils';
import type {
	IFileTreeSelectionIntent,
	IObservableFileTreeSelectionIntent
} from '../state/selection/file-tree-selection-intent';
import { FileTreeSelectionIntentService } from '../state/selection/file-tree-selection-intent-impl';
import type { IEditorUserSpaceStateService } from '../state/user-space/editor-user-space-state';
import { EditorUserSpaceStateService } from '../state/user-space/editor-user-space-state-impl';
import type { IEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
import { EditorDocumentFactory } from '$lib/core/editor/document-factory/editor-document-factory-model-impl';
import type { FileSystemWriteOrigin } from '$lib/core/file-system/domain/file-system-models';
import type {
	IEditorFileTreeWorkspaceV2,
	IEditorWorkspaceV2
} from '$lib/core/workspace/editor-workspace-v2';
import {
	WORKSPACE_MINIMUM_LOADING_DELAY_MS,
	WorkspaceStatus
} from '$lib/core/workspace/editor-workspace-v2';
import type { IFileURIBuilder } from '$lib/core/workspace/sync/document-record/file-uri-builder';
import { FileURIBuilder } from '$lib/core/workspace/sync/document-record/file-uri-builder-impl';
import type {
	IEditorSaveCommand,
	IObservableEditorSaveState
} from '$lib/core/editor/save/editor-save-service';
import { EditorSaveService } from '$lib/core/editor/save/editor-save-service-impl';
import type { IContentHashService } from '$lib/core/file-system/hashing/content-hash';
import { ContentHashService } from '$lib/core/file-system/hashing/content-hash';
import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { ConsoleEditorLogger } from '$lib/core/shared/logger/editor-logger-impl';
import { EditorDocumentRegistry } from '$lib/core/editor/document-registry/editor-document-registry-impl';
import type { IEditorDocumentProvider } from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider';
import { EditorDocumentProvider } from '$lib/core/editor/document-lifecycle/document-load/editor-document-provider-impl';
import type { IEditorDocumentService } from '$lib/core/editor/document-lifecycle/editor-document-service';
import { EditorDocumentService } from '$lib/core/editor/document-lifecycle/editor-document-service-impl';
import type { IEditorDocumentReloadService } from '$lib/core/editor/reload-service/editor-document-reload-service';
import { EditorDocumentReloadService } from '$lib/core/editor/reload-service/editor-document-reload-service-impl';
import type {
	IDocumentOpenFailureRegistry,
	IObservableDocumentOpenFailureRegistry
} from '$lib/core/editor/document-lifecycle/open-failure-registry/document-open-failure-registry';
import { DocumentOpenFailureRegistry } from '$lib/core/editor/document-lifecycle/open-failure-registry/document-open-failure-registry-impl';
import type {
	ICommandRegistry,
	IPrimitiveCommandRegistry
} from '$lib/core/file-tree-v2/commands/command-registry';
import { CommandRegistryImpl } from '$lib/core/file-tree-v2/commands/command-registry-impl';
import type { IFileTreeUICommandErrorFactory } from '$lib/core/file-tree-v2/commands/ui/file-tree-ui-command-error-factory';
import { FileTreeUICommandErrorFactory } from '$lib/core/file-tree-v2/commands/ui/impl/file-tree-ui-command-error-factory-impl';
import type { IFileTreeDragController } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import { FileTreeDragControllerImpl } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller-impl';
import type { IFileTreeDragHoverExpander } from '$lib/core/file-tree-v2/drag/file-tree-drag-hover-expander';
import { FileTreeDragHoverExpanderImpl } from '$lib/core/file-tree-v2/drag/file-tree-drag-hover-expander-impl';
import { FileTreeDropIntentEvaluatorImpl } from '$lib/core/file-tree-v2/drag/file-tree-drop-intent-evaluator-impl';
import type { IFileTreeDropIntentEvaluator } from '$lib/core/file-tree-v2/drag/file-tree-drop-intent-evaluator';
import type { IFileTreeProjection } from '$lib/core/file-tree-v2/projection/file-tree-projection';
import { FileTreeProjectionImpl } from '$lib/core/file-tree-v2/projection/file-tree-projection-impl';
import type { IFileTreeSearchService } from '$lib/core/file-tree-v2/search/file-tree-search-service';
import { FileTreeSearchService } from '$lib/core/file-tree-v2/search/file-tree-search-service-impl';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import { FileTreeImpl } from '$lib/core/file-tree-v2/tree/file-tree-impl';
import type { ITabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
import { TabProjectionService } from '$lib/core/tab-bar/tab-projection-service-impl';

class EditorFileTreeWorkspaceV2 implements IEditorFileTreeWorkspaceV2 {
	readonly fileTree: IFileTree;
	readonly fileTreeProjection: IFileTreeProjection;
	readonly fileTreeSearchService: IFileTreeSearchService;
	readonly fileTreeDragController: IFileTreeDragController;
	readonly commandRegistry: ICommandRegistry & IPrimitiveCommandRegistry;

	private readonly fileTreeDropIntentEvaluator: IFileTreeDropIntentEvaluator;
	private readonly fileTreeDragHoverExpander: IFileTreeDragHoverExpander;

	constructor(
		fileSystemService: IFileSystemService,
		selectionIntent: IObservableFileTreeSelectionIntent,
		intentState: IObservableEditorIntentState,
		intentCommands: IEditorIntentCommands,
		userSpaceStateService: IEditorUserSpaceStateService,
		editorSaveService: IObservableEditorSaveState & IEditorSaveCommand
	) {
		this.fileTree = new FileTreeImpl(fileSystemService);
		this.fileTreeSearchService = new FileTreeSearchService(fileSystemService);
		this.fileTreeDropIntentEvaluator = new FileTreeDropIntentEvaluatorImpl(fileSystemService);
		this.fileTreeDragController = new FileTreeDragControllerImpl(
			fileSystemService,
			this.fileTreeDropIntentEvaluator
		);
		this.fileTreeDragHoverExpander = new FileTreeDragHoverExpanderImpl(
			this.fileTreeDragController,
			this.fileTree
		);
		const uiCommandErrorFactory: IFileTreeUICommandErrorFactory =
			new FileTreeUICommandErrorFactory();
		this.commandRegistry = new CommandRegistryImpl(
			this.fileTree,
			fileSystemService,
			selectionIntent,
			intentState,
			intentCommands,
			uiCommandErrorFactory,
			editorSaveService,
			editorSaveService
		);
		this.fileTreeProjection = new FileTreeProjectionImpl(
			this.fileTree,
			fileSystemService,
			selectionIntent,
			intentState,
			userSpaceStateService,
			editorSaveService,
			this.fileTreeSearchService,
			this.fileTreeDragController
		);
	}

	dispose(): void {
		this.commandRegistry.dispose();
		this.fileTreeProjection.dispose();
		this.fileTreeDragHoverExpander.dispose();
		this.fileTreeDragController.dispose();
		this.fileTreeSearchService.dispose();
		this.fileTree.dispose();
	}
}

export class EditorWorkspaceV2 implements IEditorWorkspaceV2 {
	readonly fileSystemService: IFileSystemService;
	readonly editorDocumentService: IEditorDocumentService;
	readonly documentOpenFailureRegistry: IObservableDocumentOpenFailureRegistry;
	readonly orchestration: IEditorPresentationService;
	readonly codeEditor: ICodeEditorComponentController;
	readonly intentService: IEditorIntentService;
	readonly selectionIntent: IFileTreeSelectionIntent;
	readonly userSpaceStateService: IEditorUserSpaceStateService;
	readonly editorSaveService: IObservableEditorSaveState & IEditorSaveCommand & IDisposable1;
	readonly fileTreeWorkspace: IEditorFileTreeWorkspaceV2;
	readonly tabProjection: ITabProjectionService;
	readonly editorPromptManager: IEditorPromptManager;
	readonly status: Readable<WorkspaceStatus>;

	private readonly _status: Writable<WorkspaceStatus>;
	private readonly documentOpenFailureRegistryState: IDocumentOpenFailureRegistry;
	private readonly viewStateRegistry: IEditorViewStateRegistry;
	private readonly editorDocumentReloadService: IEditorDocumentReloadService;
	private readonly conflictResolutionService: IConflictResolutionService;
	private readonly invalidDocumentService: IInvalidDocumentService;

	constructor(
		fileSystemService: IFileSystemService,
		editorConfigurationService: IEditorConfigurationService,
		userSpaceStateService: IEditorUserSpaceStateService = new EditorUserSpaceStateService()
	) {
		this.fileSystemService = fileSystemService;
		this.userSpaceStateService = userSpaceStateService;

		const workspaceOrigin: FileSystemWriteOrigin =
			`editor:${crypto.randomUUID()}` as FileSystemWriteOrigin;

		const logger: IEditorLogger = new ConsoleEditorLogger();

		const contentHashService: IContentHashService = new ContentHashService();

		const fileURIBuilder: IFileURIBuilder = new FileURIBuilder();

		const editorDocumentFactory: IEditorDocumentFactory = new EditorDocumentFactory(
			contentHashService,
			fileSystemService,
			workspaceOrigin
		);

		const editorDocumentRegistry: EditorDocumentRegistry = new EditorDocumentRegistry(
			editorConfigurationService
		);

		this.selectionIntent = new FileTreeSelectionIntentService();

		this.editorSaveService = new EditorSaveService(editorDocumentRegistry, logger);

		const documentLoader: IEditorDocumentProvider = new EditorDocumentProvider(
			fileSystemService,
			fileURIBuilder,
			editorDocumentFactory
		);
		const documentOpenFailureRegistry: IDocumentOpenFailureRegistry =
			new DocumentOpenFailureRegistry();
		this.documentOpenFailureRegistryState = documentOpenFailureRegistry;
		this.documentOpenFailureRegistry = documentOpenFailureRegistry;

		this.editorDocumentService = new EditorDocumentService(
			documentLoader,
			editorDocumentRegistry,
			documentOpenFailureRegistry,
			logger
		);

		this.editorDocumentReloadService = new EditorDocumentReloadService(
			fileSystemService,
			this.editorDocumentService
		);

		this.intentService = new EditorIntentService(this.editorDocumentService, logger);

		this.viewStateRegistry = new EditorViewStateRegistry();

		this.codeEditor = new CodeEditorComponentController(editorConfigurationService);
		const attachmentPort: EditorAttachmentPort = new EditorAttachmentPort(this.codeEditor);

		this.orchestration = new EditorOrchestrationService(
			this.editorDocumentService,
			this.intentService,
			this.viewStateRegistry,
			attachmentPort
		);

		this.fileTreeWorkspace = new EditorFileTreeWorkspaceV2(
			fileSystemService,
			this.selectionIntent,
			this.intentService,
			this.intentService,
			this.userSpaceStateService,
			this.editorSaveService
		);

		this.tabProjection = new TabProjectionService(
			this.intentService,
			fileSystemService,
			this.editorSaveService,
			this.editorDocumentService
		);

		this.conflictResolutionService = new ConflictResolutionService(editorDocumentRegistry);

		this.invalidDocumentService = new InvalidDocumentService(
			editorDocumentRegistry,
			this.intentService
		);

		this.editorPromptManager = new EditorPromptManager(
			this.conflictResolutionService,
			this.invalidDocumentService,
			this.intentService,
			fileSystemService,
			logger
		);

		this._status = writable<WorkspaceStatus>(WorkspaceStatus.LOADING);
		this.status = this._status;
	}

	async initialize(): Promise<Result<void, never>> {
		await new Promise<void>((resolve: () => void): void => {
			setTimeout(resolve, WORKSPACE_MINIMUM_LOADING_DELAY_MS);
		});

		this._status.set(WorkspaceStatus.READY);

		return success(undefined);
	}

	dispose(): void {
		this.tabProjection.dispose();
		this.fileTreeWorkspace.dispose();
		this.editorPromptManager.dispose();
		this.invalidDocumentService.dispose();
		this.conflictResolutionService.dispose();
		this.editorDocumentReloadService.dispose();
		this.orchestration.dispose();
		this.codeEditor.dispose();
		this.intentService.dispose();
		this.viewStateRegistry.dispose();
		this.editorSaveService.dispose();
		this.editorDocumentService.dispose();
		this.documentOpenFailureRegistryState.dispose();
	}
}
