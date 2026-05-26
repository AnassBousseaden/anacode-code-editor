import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { DraftRevision } from '$lib/core/editor/document/savable-editor-document';

export interface ConflictItem {
	readonly nodeID: NodeID;
	readonly revision: DraftRevision;
}
