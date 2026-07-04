import { getContext, setContext } from 'svelte';

import type { EditorMessages } from '$lib/core/localization/localization-models';
import { resolveEditorMessages } from '$lib/core/localization/localization-models';

const EDITOR_MESSAGES_CONTEXT: unique symbol = Symbol('anacode-editor-messages');

// English fallback keeps leaf components renderable without a session root.
const FALLBACK_MESSAGES: EditorMessages = resolveEditorMessages();

export function provideEditorMessages(messages: EditorMessages): void {
	setContext(EDITOR_MESSAGES_CONTEXT, messages);
}

export function getEditorMessages(): EditorMessages {
	return getContext<EditorMessages | undefined>(EDITOR_MESSAGES_CONTEXT) ?? FALLBACK_MESSAGES;
}
