import { type Readable, type Unsubscriber, type Writable, writable } from 'svelte/store';

import type {
	IConflictResolutionService,
	OverwriteConflictError,
	OverwriteConflictErrorKind,
	ReloadConflictError,
	ReloadConflictErrorKind
} from '$lib/core/editor/conflict-resolution/conflict-resolution-service';
import type { ConflictItem } from '$lib/core/editor/conflict-resolution/conflict-resolution-models';
import type {
	CloseInvalidDocumentError,
	CloseInvalidDocumentErrorKind,
	IInvalidDocumentService
} from '$lib/core/editor/invalid-document/invalid-document-service';
import type { InvalidItem } from '$lib/core/editor/invalid-document/invalid-document-models';
import type { DraftRevision } from '$lib/core/editor/document/savable-editor-document';
import type {
	FileSystemNode,
	NodeID
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';
import type { Result } from '$lib/core/shared/models-utils';
import type {
	ConflictResolutionPrompt,
	EditorPrompt,
	EditorPromptID,
	InvalidDocumentPrompt,
	NotificationPrompt
} from '$lib/core/editor-prompt/editor-prompt';
import {
	AWAITING_CONFLICT_PROMPT_STATUS,
	AWAITING_INVALID_DOCUMENT_PROMPT_STATUS,
	ConflictPromptStatusKind,
	ConflictResolutionStrategy,
	EditorPromptKind,
	InvalidDocumentPromptStatusKind,
	NotificationPromptToneKind
} from '$lib/core/editor-prompt/editor-prompt';
import type { IEditorPromptManager } from '$lib/core/editor-prompt/editor-prompt-manager';
import {
	CloseInvalidDocumentPromptMessages,
	IntentCloseFailurePromptMessages,
	OverwriteConflictPromptMessages,
	ReloadConflictPromptMessages
} from '$lib/core/editor-prompt/editor-prompt-messages';
import type {
	EditorIntentEvent,
	IEditorIntentService
} from '$lib/core/editor/intent/editor-intent-service';
import { EditorIntentEventType } from '$lib/core/editor/intent/editor-intent-service';
import { CloseIntentErrorKind } from '$lib/core/editor/intent/editor-intent-models';

const LOG_SCOPE: string = 'editor-prompt-manager';

export class EditorPromptManager implements IEditorPromptManager {
	public readonly prompts: Readable<ReadonlyArray<EditorPrompt>>;

	private readonly conflictResolutionService: IConflictResolutionService;
	private readonly invalidDocumentService: IInvalidDocumentService;
	private readonly fileSystemService: IFileSystemService;
	private readonly logger: IEditorLogger;

	private readonly promptsStore: Writable<ReadonlyArray<EditorPrompt>>;
	private readonly conflictItemsUnsubscribe: Unsubscriber;
	private readonly invalidItemsUnsubscribe: Unsubscriber;
	private readonly intentEventsUnsubscribe: Unsubscriber;

	private currentConflictItems: ReadonlyArray<ConflictItem>;
	private currentInvalidItems: ReadonlyArray<InvalidItem>;
	private currentPrompts: ReadonlyArray<EditorPrompt>;
	private nextPromptID: number;
	private disposed: boolean;

	public constructor(
		conflictResolutionService: IConflictResolutionService,
		invalidDocumentService: IInvalidDocumentService,
		intentService: IEditorIntentService,
		fileSystemService: IFileSystemService,
		logger: IEditorLogger
	) {
		this.conflictResolutionService = conflictResolutionService;
		this.invalidDocumentService = invalidDocumentService;
		this.fileSystemService = fileSystemService;
		this.logger = logger;
		this.currentConflictItems = [];
		this.currentInvalidItems = [];
		this.currentPrompts = [];
		this.promptsStore = writable<ReadonlyArray<EditorPrompt>>(this.currentPrompts);
		this.prompts = this.promptsStore;
		this.nextPromptID = 0;
		this.disposed = false;

		this.conflictItemsUnsubscribe = this.conflictResolutionService.items.subscribe(
			(items: ReadonlyArray<ConflictItem>): void => {
				this.currentConflictItems = items;
				this.reconcilePrompts();
			}
		);
		this.invalidItemsUnsubscribe = this.invalidDocumentService.items.subscribe(
			(items: ReadonlyArray<InvalidItem>): void => {
				this.currentInvalidItems = items;
				this.reconcilePrompts();
			}
		);
		this.intentEventsUnsubscribe = intentService.onTransaction(
			(event: EditorIntentEvent): void => {
				this.handleIntentEvent(event);
			}
		);
	}

	public dispose(): void {
		this.disposed = true;
		this.conflictItemsUnsubscribe();
		this.invalidItemsUnsubscribe();
		this.intentEventsUnsubscribe();
		this.setPrompts([]);
	}

	public getPrompt(promptID: EditorPromptID): EditorPrompt | null {
		for (const prompt of this.currentPrompts) {
			if (prompt.id === promptID) {
				return prompt;
			}
		}
		return null;
	}

	public respondToConflict(
		promptID: EditorPromptID,
		strategy: ConflictResolutionStrategy
	): void {
		this.dispatchConflictStrategy(promptID, strategy);
	}

	public close(promptID: EditorPromptID): void {
		this.dispatchClose(promptID);
	}

	public retry(promptID: EditorPromptID): void {
		const prompt: EditorPrompt | null = this.getPrompt(promptID);
		if (prompt === null) {
			return;
		}
		if (prompt.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
			if (prompt.status.kind !== ConflictPromptStatusKind.FAILED) {
				return;
			}
			this.dispatchConflictStrategy(promptID, prompt.status.strategy);
			return;
		}
		if (prompt.kind === EditorPromptKind.INVALID_DOCUMENT) {
			if (prompt.status.kind !== InvalidDocumentPromptStatusKind.FAILED) {
				return;
			}
			this.dispatchClose(promptID);
			return;
		}
	}

	public hide(promptID: EditorPromptID): void {
		const prompt: EditorPrompt | null = this.getPrompt(promptID);
		if (prompt === null) {
			return;
		}
		if (prompt.hidden) {
			return;
		}
		if (this.isPromptInFlight(prompt)) {
			return;
		}
		if (prompt.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
			this.updateConflictPrompt(
				promptID,
				(existing: ConflictResolutionPrompt): ConflictResolutionPrompt => {
					return { ...existing, hidden: true };
				}
			);
			return;
		}
		if (prompt.kind === EditorPromptKind.INVALID_DOCUMENT) {
			this.updateInvalidPrompt(
				promptID,
				(existing: InvalidDocumentPrompt): InvalidDocumentPrompt => {
					return { ...existing, hidden: true };
				}
			);
			return;
		}
		this.updateNotificationPrompt(
			promptID,
			(existing: NotificationPrompt): NotificationPrompt => {
				return { ...existing, hidden: true };
			}
		);
	}

	public dismiss(promptID: EditorPromptID): void {
		const prompt: EditorPrompt | null = this.getPrompt(promptID);
		if (prompt === null) {
			return;
		}
		if (prompt.kind !== EditorPromptKind.NOTIFICATION) {
			return;
		}
		const next: EditorPrompt[] = this.currentPrompts.filter(
			(existing: EditorPrompt): boolean => existing.id !== promptID
		);
		this.setPrompts(next);
	}

	public showAll(): void {
		let mutated: boolean = false;
		const next: EditorPrompt[] = this.currentPrompts.map((prompt: EditorPrompt): EditorPrompt => {
			if (!prompt.hidden) {
				return prompt;
			}
			mutated = true;
			if (prompt.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
				const shown: ConflictResolutionPrompt = { ...prompt, hidden: false };
				return shown;
			}
			if (prompt.kind === EditorPromptKind.INVALID_DOCUMENT) {
				const shown: InvalidDocumentPrompt = { ...prompt, hidden: false };
				return shown;
			}
			const shown: NotificationPrompt = { ...prompt, hidden: false };
			return shown;
		});
		if (!mutated) {
			return;
		}
		this.setPrompts(next);
	}

	private handleIntentEvent(event: EditorIntentEvent): void {
		if (event.type !== EditorIntentEventType.INTENT_DID_FAIL_CLOSE) {
			return;
		}
		this.appendCloseFailureNotification(event.error.kind);
	}

	private appendCloseFailureNotification(errorKind: CloseIntentErrorKind): void {
		const copy = IntentCloseFailurePromptMessages[errorKind];
		const promptID: EditorPromptID = this.allocatePromptID();
		const notification: NotificationPrompt = {
			id: promptID,
			kind: EditorPromptKind.NOTIFICATION,
			tone: NotificationPromptToneKind.WARNING,
			title: copy.title,
			content: copy.content,
			hidden: false
		};
		this.setPrompts(this.currentPrompts.concat(notification));
	}

	private dispatchConflictStrategy(
		promptID: EditorPromptID,
		strategy: ConflictResolutionStrategy
	): void {
		const prompt: EditorPrompt | null = this.getPrompt(promptID);
		if (prompt === null) {
			return;
		}
		if (prompt.kind !== EditorPromptKind.CONFLICT_RESOLUTION) {
			return;
		}
		if (prompt.status.kind === ConflictPromptStatusKind.RESPONDING) {
			return;
		}

		const nodeID: NodeID = prompt.nodeID;
		const revision: DraftRevision = prompt.revision;

		this.updateConflictPrompt(
			promptID,
			(existing: ConflictResolutionPrompt): ConflictResolutionPrompt => {
				return {
					...existing,
					status: {
						kind: ConflictPromptStatusKind.RESPONDING,
						strategy: strategy
					}
				};
			}
		);

		if (strategy === ConflictResolutionStrategy.OVERWRITE) {
			void this.runOverwrite(promptID, nodeID, revision);
			return;
		}
		void this.runReload(promptID, nodeID, revision);
	}

	private dispatchClose(promptID: EditorPromptID): void {
		const prompt: EditorPrompt | null = this.getPrompt(promptID);
		if (prompt === null) {
			return;
		}
		if (prompt.kind !== EditorPromptKind.INVALID_DOCUMENT) {
			return;
		}
		if (prompt.status.kind === InvalidDocumentPromptStatusKind.CLOSING) {
			return;
		}

		const nodeID: NodeID = prompt.nodeID;
		const revision: DraftRevision = prompt.revision;

		this.updateInvalidPrompt(
			promptID,
			(existing: InvalidDocumentPrompt): InvalidDocumentPrompt => {
				return {
					...existing,
					status: { kind: InvalidDocumentPromptStatusKind.CLOSING }
				};
			}
		);

		void this.runClose(promptID, nodeID, revision);
	}

	private async runOverwrite(
		promptID: EditorPromptID,
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<void> {
		const result: Result<void, OverwriteConflictError> =
			await this.conflictResolutionService.overwrite(nodeID, revision);
		if (this.disposed) {
			return;
		}
		if (result.ok) {
			return;
		}
		const errorKind: OverwriteConflictErrorKind = result.error.kind;
		const message: string = OverwriteConflictPromptMessages[errorKind];
		this.logResolutionFailure('overwrite.failed', nodeID, errorKind, result.error.message);
		this.markConflictFailed(promptID, ConflictResolutionStrategy.OVERWRITE, message);
	}

	private async runReload(
		promptID: EditorPromptID,
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<void> {
		const result: Result<void, ReloadConflictError> =
			await this.conflictResolutionService.reload(nodeID, revision);
		if (this.disposed) {
			return;
		}
		if (result.ok) {
			return;
		}
		const errorKind: ReloadConflictErrorKind = result.error.kind;
		const message: string = ReloadConflictPromptMessages[errorKind];
		this.logResolutionFailure('reload.failed', nodeID, errorKind, result.error.message);
		this.markConflictFailed(promptID, ConflictResolutionStrategy.RELOAD, message);
	}

	private async runClose(
		promptID: EditorPromptID,
		nodeID: NodeID,
		revision: DraftRevision
	): Promise<void> {
		const result: Result<void, CloseInvalidDocumentError> =
			await this.invalidDocumentService.close(nodeID, revision);
		if (this.disposed) {
			return;
		}
		if (result.ok) {
			return;
		}
		const errorKind: CloseInvalidDocumentErrorKind = result.error.kind;
		const message: string = CloseInvalidDocumentPromptMessages[errorKind];
		this.logResolutionFailure('close.failed', nodeID, errorKind, result.error.message);
		this.markInvalidFailed(promptID, message);
	}

	private markConflictFailed(
		promptID: EditorPromptID,
		strategy: ConflictResolutionStrategy,
		message: string
	): void {
		this.updateConflictPrompt(
			promptID,
			(existing: ConflictResolutionPrompt): ConflictResolutionPrompt => {
				return {
					...existing,
					status: {
						kind: ConflictPromptStatusKind.FAILED,
						strategy: strategy,
						message: message
					}
				};
			}
		);
	}

	private markInvalidFailed(promptID: EditorPromptID, message: string): void {
		this.updateInvalidPrompt(
			promptID,
			(existing: InvalidDocumentPrompt): InvalidDocumentPrompt => {
				return {
					...existing,
					status: {
						kind: InvalidDocumentPromptStatusKind.FAILED,
						message: message
					}
				};
			}
		);
	}

	private reconcilePrompts(): void {
		const conflictByNodeID: Map<NodeID, ConflictItem> = new Map<NodeID, ConflictItem>();
		for (const item of this.currentConflictItems) {
			conflictByNodeID.set(item.nodeID, item);
		}
		const invalidByNodeID: Map<NodeID, InvalidItem> = new Map<NodeID, InvalidItem>();
		for (const item of this.currentInvalidItems) {
			invalidByNodeID.set(item.nodeID, item);
		}

		const nextPrompts: EditorPrompt[] = [];
		const conflictNodeIDsWithPrompt: Set<NodeID> = new Set<NodeID>();
		const invalidNodeIDsWithPrompt: Set<NodeID> = new Set<NodeID>();

		for (const existing of this.currentPrompts) {
			if (existing.kind === EditorPromptKind.NOTIFICATION) {
				nextPrompts.push(existing);
				continue;
			}
			if (existing.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
				const matchingItem: ConflictItem | undefined = conflictByNodeID.get(existing.nodeID);
				if (matchingItem === undefined) {
					continue;
				}
				if (matchingItem.revision.value !== existing.revision.value) {
					continue;
				}
				nextPrompts.push(existing);
				conflictNodeIDsWithPrompt.add(existing.nodeID);
				continue;
			}
			const matchingInvalid: InvalidItem | undefined = invalidByNodeID.get(existing.nodeID);
			if (matchingInvalid === undefined) {
				continue;
			}
			if (matchingInvalid.revision.value !== existing.revision.value) {
				continue;
			}
			nextPrompts.push(existing);
			invalidNodeIDsWithPrompt.add(existing.nodeID);
		}

		for (const [nodeID, item] of conflictByNodeID) {
			if (conflictNodeIDsWithPrompt.has(nodeID)) {
				continue;
			}
			const fileName: string = this.resolveFileName(nodeID);
			const promptID: EditorPromptID = this.allocatePromptID();
			const prompt: ConflictResolutionPrompt = {
				id: promptID,
				kind: EditorPromptKind.CONFLICT_RESOLUTION,
				nodeID: nodeID,
				fileName: fileName,
				revision: item.revision,
				status: AWAITING_CONFLICT_PROMPT_STATUS,
				hidden: false
			};
			nextPrompts.push(prompt);
		}

		for (const [nodeID, item] of invalidByNodeID) {
			if (invalidNodeIDsWithPrompt.has(nodeID)) {
				continue;
			}
			const fileName: string = this.resolveFileName(nodeID);
			const promptID: EditorPromptID = this.allocatePromptID();
			const prompt: InvalidDocumentPrompt = {
				id: promptID,
				kind: EditorPromptKind.INVALID_DOCUMENT,
				nodeID: nodeID,
				fileName: fileName,
				revision: item.revision,
				status: AWAITING_INVALID_DOCUMENT_PROMPT_STATUS,
				hidden: false
			};
			nextPrompts.push(prompt);
		}

		this.setPrompts(nextPrompts);
	}

	private isPromptInFlight(prompt: EditorPrompt): boolean {
		if (prompt.kind === EditorPromptKind.CONFLICT_RESOLUTION) {
			return prompt.status.kind === ConflictPromptStatusKind.RESPONDING;
		}
		if (prompt.kind === EditorPromptKind.INVALID_DOCUMENT) {
			return prompt.status.kind === InvalidDocumentPromptStatusKind.CLOSING;
		}
		return false;
	}

	private updateConflictPrompt(
		promptID: EditorPromptID,
		updater: (existing: ConflictResolutionPrompt) => ConflictResolutionPrompt
	): void {
		const index: number = this.currentPrompts.findIndex(
			(prompt: EditorPrompt): boolean => prompt.id === promptID
		);
		if (index === -1) {
			return;
		}
		const existing: EditorPrompt = this.currentPrompts[index];
		if (existing.kind !== EditorPromptKind.CONFLICT_RESOLUTION) {
			return;
		}
		const updated: ConflictResolutionPrompt = updater(existing);
		const next: EditorPrompt[] = this.currentPrompts.slice();
		next[index] = updated;
		this.setPrompts(next);
	}

	private updateInvalidPrompt(
		promptID: EditorPromptID,
		updater: (existing: InvalidDocumentPrompt) => InvalidDocumentPrompt
	): void {
		const index: number = this.currentPrompts.findIndex(
			(prompt: EditorPrompt): boolean => prompt.id === promptID
		);
		if (index === -1) {
			return;
		}
		const existing: EditorPrompt = this.currentPrompts[index];
		if (existing.kind !== EditorPromptKind.INVALID_DOCUMENT) {
			return;
		}
		const updated: InvalidDocumentPrompt = updater(existing);
		const next: EditorPrompt[] = this.currentPrompts.slice();
		next[index] = updated;
		this.setPrompts(next);
	}

	private updateNotificationPrompt(
		promptID: EditorPromptID,
		updater: (existing: NotificationPrompt) => NotificationPrompt
	): void {
		const index: number = this.currentPrompts.findIndex(
			(prompt: EditorPrompt): boolean => prompt.id === promptID
		);
		if (index === -1) {
			return;
		}
		const existing: EditorPrompt = this.currentPrompts[index];
		if (existing.kind !== EditorPromptKind.NOTIFICATION) {
			return;
		}
		const updated: NotificationPrompt = updater(existing);
		const next: EditorPrompt[] = this.currentPrompts.slice();
		next[index] = updated;
		this.setPrompts(next);
	}

	private setPrompts(next: ReadonlyArray<EditorPrompt>): void {
		this.currentPrompts = next;
		this.promptsStore.set(next);
	}

	private allocatePromptID(): EditorPromptID {
		const next: number = this.nextPromptID + 1;
		this.nextPromptID = next;
		return next as EditorPromptID;
	}

	private resolveFileName(nodeID: NodeID): string {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		if (node === null) {
			return `node-${String(nodeID)}`;
		}
		return node.name;
	}

	private logResolutionFailure(
		event: string,
		nodeID: NodeID,
		errorKind: string,
		errorMessage: string
	): void {
		this.logger.log({
			scope: LOG_SCOPE,
			event: event,
			level: EditorLogLevel.WARN,
			data: {
				nodeID: String(nodeID),
				errorKind: errorKind,
				errorMessage: errorMessage
			}
		});
	}
}
