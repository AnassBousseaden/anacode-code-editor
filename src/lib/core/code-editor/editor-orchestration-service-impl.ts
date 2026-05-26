import type { editor } from 'monaco-editor';
import { type Unsubscriber } from 'svelte/store';

import type { IEditorAttachmentPort } from '$lib/core/code-editor/editor-attachment-port';
import {
	type DocumentState,
	DocumentStateKind
} from '$lib/core/code-editor/editor-orchestration-models';
import type { IEditorPresentationService } from '$lib/core/code-editor/editor-orchestration-service';
import type { ISavableEditorDocument } from '$lib/core/editor/document/savable-editor-document';
import type {
	EditorDocumentLifecycleEvent,
	IEditorDocumentService
} from '$lib/core/editor/document-lifecycle/editor-document-service';
import { EditorDocumentLifecycleEventType } from '$lib/core/editor/document-lifecycle/editor-document-service';
import type {
	EditorIntentEvent,
	IEditorIntentService
} from '$lib/core/editor/intent/editor-intent-service';
import { EditorIntentEventType } from '$lib/core/editor/intent/editor-intent-service';
import type { IEditorViewStateWriter } from '$lib/core/editor/view-state/editor-view-state-registry';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';

export class EditorOrchestrationService implements IEditorPresentationService {
	private readonly editorDocumentService: IEditorDocumentService;
	private readonly intentService: IEditorIntentService;
	private readonly viewStateWriter: IEditorViewStateWriter;
	private readonly attachmentPort: IEditorAttachmentPort;

	private readonly activeDocumentUnsubscribe: Unsubscriber;
	private readonly intentEventsUnsubscribe: Unsubscriber;
	private readonly documentLifecycleUnsubscribe: Unsubscriber;

	private currentState: DocumentState;
	private lastBoundNodeID: NodeID | null;

	public constructor(
		editorDocumentService: IEditorDocumentService,
		intentService: IEditorIntentService,
		viewStateWriter: IEditorViewStateWriter,
		attachmentPort: IEditorAttachmentPort
	) {
		this.editorDocumentService = editorDocumentService;
		this.intentService = intentService;
		this.viewStateWriter = viewStateWriter;
		this.attachmentPort = attachmentPort;

		this.currentState = { kind: DocumentStateKind.NONE };
		this.lastBoundNodeID = null;

		this.activeDocumentUnsubscribe = this.intentService.activeDocument.subscribe(
			(state: DocumentState): void => {
				this.handleActiveDocumentChange(state);
			}
		);

		this.intentEventsUnsubscribe = this.intentService.onTransaction(
			(event: EditorIntentEvent): void => {
				this.handleIntentEvent(event);
			}
		);

		this.documentLifecycleUnsubscribe = this.editorDocumentService.onTransaction(
			(event: EditorDocumentLifecycleEvent): void => {
				this.handleDocumentLifecycleEvent(event);
			}
		);
	}

	public dispose(): void {
		this.saveCurrentViewState();
		this.attachmentPort.attach(null);
		this.lastBoundNodeID = null;
		this.activeDocumentUnsubscribe();
		this.intentEventsUnsubscribe();
		this.documentLifecycleUnsubscribe();
	}

	private handleActiveDocumentChange(state: DocumentState): void {
		const nextNodeID: NodeID | null = nodeIDOfState(state);
		this.currentState = state;

		if (this.lastBoundNodeID !== null && this.lastBoundNodeID !== nextNodeID) {
			this.saveCurrentViewState();
		}

		this.applyCurrentState();
	}

	private handleDocumentLifecycleEvent(event: EditorDocumentLifecycleEvent): void {
		if (event.type === EditorDocumentLifecycleEventType.DOCUMENT_WILL_RELOAD) {
			if (this.isAttachedTo(event.nodeID)) {
				this.saveCurrentViewState();
				this.attachmentPort.attach(null);
				this.lastBoundNodeID = null;
			}
			return;
		}

		if (event.type === EditorDocumentLifecycleEventType.DOCUMENT_DID_RELOAD) {
			if (this.isActiveNode(event.nodeID)) {
				this.applyCurrentState();
			}
			return;
		}

		if (event.type === EditorDocumentLifecycleEventType.DOCUMENT_WILL_EVICT) {
			if (this.isAttachedTo(event.nodeID)) {
				this.saveCurrentViewState();
				this.attachmentPort.attach(null);
				this.lastBoundNodeID = null;
			}
			return;
		}
	}

	private handleIntentEvent(event: EditorIntentEvent): void {
		if (event.type === EditorIntentEventType.INTENT_DID_OPEN) {
			if (event.focusOnReady) {
				this.attachmentPort.focus();
			}
			return;
		}
	}

	private applyCurrentState(): void {
		if (this.currentState.kind !== DocumentStateKind.LOADED) {
			this.attachmentPort.attach(null);
			this.lastBoundNodeID = null;
			return;
		}

		const nodeID: NodeID = this.currentState.nodeID;
		const document: ISavableEditorDocument | null =
			this.editorDocumentService.getLoaded(nodeID);

		if (document === null) {
			this.attachmentPort.attach(null);
			this.lastBoundNodeID = null;
			return;
		}

		this.attachmentPort.attach(document);
		this.lastBoundNodeID = nodeID;
		this.restoreViewStateIfCached(nodeID);
	}

	private saveCurrentViewState(): void {
		if (this.lastBoundNodeID === null) {
			return;
		}
		const viewState: editor.ICodeEditorViewState | null = this.attachmentPort.saveCurrentView();
		if (viewState === null) {
			return;
		}
		this.viewStateWriter.save(this.lastBoundNodeID, viewState);
	}

	private restoreViewStateIfCached(nodeID: NodeID): void {
		const viewState: editor.ICodeEditorViewState | null = this.viewStateWriter.get(nodeID);
		if (viewState === null) {
			return;
		}
		this.attachmentPort.restoreView(viewState);
	}

	private isActiveNode(nodeID: NodeID): boolean {
		if (this.currentState.kind === DocumentStateKind.NONE) {
			return false;
		}
		return this.currentState.nodeID === nodeID;
	}

	private isAttachedTo(nodeID: NodeID): boolean {
		return this.lastBoundNodeID === nodeID;
	}
}

function nodeIDOfState(state: DocumentState): NodeID | null {
	if (state.kind === DocumentStateKind.NONE) {
		return null;
	}
	return state.nodeID;
}
