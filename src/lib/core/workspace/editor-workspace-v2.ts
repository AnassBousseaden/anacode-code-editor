import type { Readable } from 'svelte/store';

import type {
	IEditorSaveCommand,
	IObservableEditorSaveState
} from '$lib/core/editor/save/editor-save-service';
import type { IDisposable1, IInitializable } from '$lib/core/shared/models-utils';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IEditorPresentationService } from '$lib/core/code-editor/editor-orchestration-service';
import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';
import type { IEditorIntentService } from '$lib/core/editor/intent/editor-intent-service';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';
import type { IFileTreeSelectionIntent } from '../state/selection/file-tree-selection-intent';
import type { IEditorUserSpaceStateService } from '../state/user-space/editor-user-space-state';
import type { IEditorDocumentService } from '$lib/core/editor/document-lifecycle/editor-document-service';
import type { IObservableDocumentOpenFailureRegistry } from '$lib/core/editor/document-lifecycle/open-failure-registry/document-open-failure-registry';
import type {
	ICommandRegistry,
	IPrimitiveCommandRegistry
} from '$lib/core/file-tree-v2/commands/command-registry';
import type { IFileTreeDragController } from '$lib/core/file-tree-v2/drag/file-tree-drag-controller';
import type { IFileTreeProjection } from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IFileTreeSearchService } from '$lib/core/file-tree-v2/search/file-tree-search-service';
import type { IFileTree } from '$lib/core/file-tree-v2/tree/file-tree';
import type { ITabProjectionService } from '$lib/core/tab-bar/tab-projection-service';

export enum WorkspaceStatus {
	LOADING = 'LOADING',
	READY = 'READY'
}

export const WORKSPACE_MINIMUM_LOADING_DELAY_MS: number = 500;

export interface IEditorFileTreeWorkspaceV2 extends IDisposable1 {
	readonly fileTree: IFileTree;
	readonly fileTreeProjection: IFileTreeProjection;
	readonly fileTreeSearchService: IFileTreeSearchService;
	readonly fileTreeDragController: IFileTreeDragController;
	readonly commandRegistry: ICommandRegistry & IPrimitiveCommandRegistry;
}

export interface IEditorWorkspaceV2 extends IDisposable1, IInitializable<void, never> {
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
}
