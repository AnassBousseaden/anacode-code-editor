import type { editor } from 'monaco-editor';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IEditorViewStateRegistry } from '$lib/core/editor/view-state/editor-view-state-registry';

export class EditorViewStateRegistry implements IEditorViewStateRegistry {
	private readonly viewStates: Map<NodeID, editor.ICodeEditorViewState>;

	constructor() {
		this.viewStates = new Map<NodeID, editor.ICodeEditorViewState>();
	}

	get(nodeID: NodeID): editor.ICodeEditorViewState | null {
		const viewState: editor.ICodeEditorViewState | undefined = this.viewStates.get(nodeID);

		if (viewState === undefined) {
			return null;
		}

		return viewState;
	}

	save(nodeID: NodeID, viewState: editor.ICodeEditorViewState): void {
		this.viewStates.set(nodeID, viewState);
	}

	clear(nodeID: NodeID): void {
		this.viewStates.delete(nodeID);
	}

	clearAll(): void {
		this.viewStates.clear();
	}

	dispose(): void {
		this.viewStates.clear();
	}
}
