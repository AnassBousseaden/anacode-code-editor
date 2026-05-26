import type { Readable } from 'svelte/store';

import type {
	DocumentState,
	OpenIntentError
} from '$lib/core/code-editor/editor-orchestration-models';
import type {
	CloseAllIntentError,
	CloseIntentError,
	SaveAllIntentError,
	SaveIntentError
} from '$lib/core/editor/intent/editor-intent-models';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	IDisposable1,
	ITransactionEventSource,
	Result
} from '$lib/core/shared/models-utils';

export interface IObservableEditorIntentState {
	readonly activeDocument: Readable<DocumentState>;
	readonly openDocumentIDs: Readable<ReadonlyArray<NodeID>>;
}

export enum EditorIntentEventType {
	INTENT_DID_OPEN = 'INTENT_DID_OPEN',
	INTENT_DID_FAIL_CLOSE = 'INTENT_DID_FAIL_CLOSE'
}

export interface EditorIntentDidOpenEvent {
	readonly type: EditorIntentEventType.INTENT_DID_OPEN;
	readonly nodeID: NodeID;
	readonly focusOnReady: boolean;
}

export interface EditorIntentDidFailCloseEvent {
	readonly type: EditorIntentEventType.INTENT_DID_FAIL_CLOSE;
	readonly nodeID: NodeID;
	readonly error: CloseIntentError;
}

export type EditorIntentEvent = EditorIntentDidOpenEvent | EditorIntentDidFailCloseEvent;

export interface IEditorIntentCommands {
	open(nodeID: NodeID): Promise<Result<void, OpenIntentError>>;
	openPreserveFocus(nodeID: NodeID): Promise<Result<void, OpenIntentError>>;
	close(nodeID: NodeID): Promise<Result<void, CloseIntentError>>;
	closeActive(): Promise<Result<void, CloseIntentError>>;
	closeAll(): Promise<Result<void, CloseAllIntentError>>;
	save(nodeID: NodeID): Promise<Result<void, SaveIntentError>>;
	saveAll(): Promise<Result<void, SaveAllIntentError>>;
}

export interface IEditorIntentService
	extends
		IObservableEditorIntentState,
		IEditorIntentCommands,
		ITransactionEventSource<EditorIntentEvent>,
		IDisposable1 {}
