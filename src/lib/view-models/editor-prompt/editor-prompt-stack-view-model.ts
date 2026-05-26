import type { Readable } from 'svelte/store';

import type { EditorPromptAction } from '$lib/view-models/editor-prompt/editor-prompt-action';
import type { EditorPromptViewItem } from '$lib/view-models/editor-prompt/editor-prompt-view-state';
import type { EditorPromptID } from '$lib/core/editor-prompt/editor-prompt';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IEditorPromptStackViewModel extends IDisposable1 {
	readonly visiblePrompts: Readable<ReadonlyArray<EditorPromptViewItem>>;
	readonly hiddenCount: Readable<number>;

	perform(promptID: EditorPromptID, action: EditorPromptAction): void;

	showAll(): void;
}
