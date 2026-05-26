import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IDocumentCache } from '$lib/core/editor/document-registry/cache/editor-document-cache';

export class DocumentCache implements IDocumentCache {
	private readonly documentMap: Map<NodeID, ISavableEditorDocument>;

	public constructor() {
		this.documentMap = new Map<NodeID, ISavableEditorDocument>();
	}

	public get(nodeID: NodeID): ISavableEditorDocument | null {
		const document: ISavableEditorDocument | undefined = this.documentMap.get(nodeID);

		if (document === undefined) {
			return null;
		}

		return document;
	}

	public set(
		nodeID: NodeID,
		document: ISavableEditorDocument
	): ISavableEditorDocument | null {
		const existingDocument: ISavableEditorDocument | undefined = this.documentMap.get(nodeID);
		this.documentMap.set(nodeID, document);

		if (existingDocument === undefined) {
			return null;
		}

		return existingDocument;
	}

	public delete(nodeID: NodeID): ISavableEditorDocument | null {
		const document: ISavableEditorDocument | undefined = this.documentMap.get(nodeID);

		if (document === undefined) {
			return null;
		}

		this.documentMap.delete(nodeID);
		return document;
	}

	public snapshot(): ReadonlyMap<NodeID, ISavableEditorDocument> {
		return new Map<NodeID, ISavableEditorDocument>(this.documentMap);
	}

	public clear(): void {
		this.documentMap.clear();
	}
}
