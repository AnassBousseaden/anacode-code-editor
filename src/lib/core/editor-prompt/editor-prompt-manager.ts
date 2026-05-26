import type { Readable } from 'svelte/store';

import type {
	ConflictResolutionStrategy,
	EditorPrompt,
	EditorPromptID
} from '$lib/core/editor-prompt/editor-prompt';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IObservableEditorPromptManager {
	readonly prompts: Readable<ReadonlyArray<EditorPrompt>>;
}

export interface IEditorPromptManager
	extends IObservableEditorPromptManager,
		IDisposable1 {
	getPrompt(promptID: EditorPromptID): EditorPrompt | null;

	respondToConflict(promptID: EditorPromptID, strategy: ConflictResolutionStrategy): void;

	close(promptID: EditorPromptID): void;

	retry(promptID: EditorPromptID): void;

	hide(promptID: EditorPromptID): void;

	dismiss(promptID: EditorPromptID): void;

	showAll(): void;
}
