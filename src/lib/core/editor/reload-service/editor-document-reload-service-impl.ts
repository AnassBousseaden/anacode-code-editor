import type { Unsubscriber } from 'svelte/store';

import type {
	AtomicEventPayload,
	FileSystemEvent,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import { FileSystemEventType } from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type { IEditorDocumentService } from '$lib/core/editor/document-lifecycle/editor-document-service';
import type { IEditorDocumentReloadService } from '$lib/core/editor/reload-service/editor-document-reload-service';

export class EditorDocumentReloadService implements IEditorDocumentReloadService {
	private readonly editorDocumentService: IEditorDocumentService;
	private readonly fsTransactionUnsubscribe: Unsubscriber;

	private pendingOperation: Promise<void>;

	public constructor(
		fileSystemService: IFileSystemService,
		editorDocumentService: IEditorDocumentService
	) {
		this.editorDocumentService = editorDocumentService;
		this.pendingOperation = Promise.resolve();

		this.fsTransactionUnsubscribe = fileSystemService.onTransaction(
			(event: FileSystemEvent): void => {
				this.handleFileSystemEvent(event);
			}
		);
	}

	public dispose(): void {
		this.fsTransactionUnsubscribe();
	}

	private handleFileSystemEvent(event: FileSystemEvent): void {
		for (const change of event.changes) {
			this.handleEventChange(change);
		}
	}

	private handleEventChange(change: AtomicEventPayload): void {
		if (
			change.type !== FileSystemEventType.NODE_RENAMED &&
			change.type !== FileSystemEventType.NODE_MOVED &&
			change.type !== FileSystemEventType.NODE_PATH_CHANGED
		) {
			return;
		}

		const nodeID: NodeID = change.after.id;
		const loadedDocument: ISavableEditorDocument | null =
			this.editorDocumentService.getLoaded(nodeID);

		if (loadedDocument === null) {
			return;
		}

		this.enqueueReload(nodeID);
	}

	private enqueueReload(nodeID: NodeID): void {
		this.pendingOperation = this.pendingOperation.then(
			async (): Promise<void> => {
				await this.editorDocumentService.reload(nodeID);
			}
		);
	}
}
