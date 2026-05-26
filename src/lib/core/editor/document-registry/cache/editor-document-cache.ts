import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';

export interface IDocumentCache {
	get(nodeID: NodeID): ISavableEditorDocument | null;
	set(nodeID: NodeID, document: ISavableEditorDocument): ISavableEditorDocument | null;
	delete(nodeID: NodeID): ISavableEditorDocument | null;
	snapshot(): ReadonlyMap<NodeID, ISavableEditorDocument>;
	clear(): void;
}
