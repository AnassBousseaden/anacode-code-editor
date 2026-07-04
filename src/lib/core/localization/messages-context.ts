import { getContext, setContext } from 'svelte';

import type { EditorMessages } from '$lib/core/localization/localization-models';
import { resolveEditorMessages } from '$lib/core/localization/localization-models';

const EDITOR_MESSAGES_CONTEXT: unique symbol = Symbol('anacode-editor-messages');

/**
 * Frozen English fallback used when no messages have been provided on the
 * context. This lets leaf components render standalone — in unit tests, docs
 * previews, or Storybook-style harnesses — without a surrounding session.
 */
const FALLBACK_MESSAGES: EditorMessages = resolveEditorMessages();

/**
 * Publish the resolved message record on the Svelte component context.
 *
 * Called once, at the editor session component root. Descendants read it with
 * {@link getEditorMessages}. This is the sole intentional use of Svelte context
 * in the codebase.
 */
export function provideEditorMessages(messages: EditorMessages): void {
	setContext(EDITOR_MESSAGES_CONTEXT, messages);
}

/**
 * Read the resolved message record from the Svelte component context.
 *
 * Falls back to a frozen English record when no session has provided messages,
 * so leaf components stay renderable in isolation (tests/previews). Must be
 * called during component initialization, per Svelte's context rules.
 */
export function getEditorMessages(): EditorMessages {
	return getContext<EditorMessages | undefined>(EDITOR_MESSAGES_CONTEXT) ?? FALLBACK_MESSAGES;
}
