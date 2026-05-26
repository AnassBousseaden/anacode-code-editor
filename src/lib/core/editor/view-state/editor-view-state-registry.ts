import type { editor } from 'monaco-editor';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IEditorViewStateReader {
	get(nodeID: NodeID): editor.ICodeEditorViewState | null;
}

export interface IEditorViewStateWriter extends IEditorViewStateReader {
	save(nodeID: NodeID, viewState: editor.ICodeEditorViewState): void;
	clear(nodeID: NodeID): void;
	clearAll(): void;
}

export interface IEditorViewStateRegistry extends IEditorViewStateWriter, IDisposable1 {}
