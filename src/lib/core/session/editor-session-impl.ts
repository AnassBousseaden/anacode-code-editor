import type { IEditorWorkspaceV2 } from '$lib/core/workspace/editor-workspace-v2';
import type { ICodeEditorComponentController } from '$lib/core/editor/code-editor/code-editor-controller';
import type { IEditorIntentService } from '$lib/core/editor/intent/editor-intent-service';
import type { IFileTreeSelectionIntent } from '$lib/core/state/selection/file-tree-selection-intent';
import type { IEditorUserSpaceStateService } from '$lib/core/state/user-space/editor-user-space-state';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';
import type { ITabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
import type { IFileTreeProjection } from '$lib/core/file-tree-v2/projection/file-tree-projection';
import type { IEditorSession } from '$lib/core/session/editor-session';

export class EditorSession implements IEditorSession {
	public readonly workspace: IEditorWorkspaceV2;
	public readonly codeEditor: ICodeEditorComponentController;
	public readonly intent: IEditorIntentService;
	public readonly selection: IFileTreeSelectionIntent;
	public readonly userSpaceState: IEditorUserSpaceStateService;
	public readonly promptManager: IEditorPromptManager;
	public readonly tabProjection: ITabProjectionService;
	public readonly fileTreeProjection: IFileTreeProjection;

	public constructor(workspace: IEditorWorkspaceV2) {
		this.workspace = workspace;
		this.codeEditor = workspace.codeEditor;
		this.intent = workspace.intentService;
		this.selection = workspace.selectionIntent;
		this.userSpaceState = workspace.userSpaceStateService;
		this.promptManager = workspace.editorPromptManager;
		this.tabProjection = workspace.tabProjection;
		this.fileTreeProjection = workspace.fileTreeWorkspace.fileTreeProjection;
	}

	public dispose(): void {
		this.workspace.dispose();
	}
}
