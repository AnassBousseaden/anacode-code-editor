import { describe, expect, it } from 'vitest';

import {
	EditorLocale,
	resolveEditorMessages,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import { en } from '$lib/core/localization/messages/en';
import { es } from '$lib/core/localization/messages/es';

describe('resolveEditorMessages', () => {
	it('returns the full English pack when no options are given', () => {
		const messages: EditorMessages = resolveEditorMessages();
		expect(messages).toEqual(en);
	});

	it('returns the English pack for an English locale', () => {
		const messages: EditorMessages = resolveEditorMessages({ locale: EditorLocale.EN });
		expect(messages.commonClose).toBe('Close');
	});

	it('overlays the selected locale over English', () => {
		const messages: EditorMessages = resolveEditorMessages({ locale: EditorLocale.ES });
		expect(messages.commonCancel).toBe(es.commonCancel);
		expect(messages.commonClose).toBe(es.commonClose);
		expect(messages.commonRetry).toBe(es.commonRetry);
	});

	it('applies consumer overrides with the highest precedence', () => {
		const messages: EditorMessages = resolveEditorMessages({
			locale: EditorLocale.ES,
			overrides: { commonClose: 'Dismiss' }
		});
		expect(messages.commonClose).toBe('Dismiss');
		expect(messages.commonCancel).toBe(es.commonCancel);
	});

	it('lets overrides win over the selected locale', () => {
		const messages: EditorMessages = resolveEditorMessages({
			locale: EditorLocale.ES,
			overrides: { commonRetry: 'Try again' }
		});
		expect(messages.commonRetry).toBe('Try again');
	});

	it('interpolates typed params through message functions', () => {
		const english: EditorMessages = resolveEditorMessages();
		expect(english.tabCloseAriaLabel({ name: 'index.ts' })).toBe('Close index.ts');

		const spanish: EditorMessages = resolveEditorMessages({ locale: EditorLocale.ES });
		expect(spanish.promptNotificationBarHidden({ count: 3 })).toBe('3 ocultas');
	});

	it('returns a frozen record that cannot be mutated', () => {
		const messages: EditorMessages = resolveEditorMessages();
		expect(Object.isFrozen(messages)).toBe(true);
		expect(() => {
			// @ts-expect-error — intentionally probing runtime immutability.
			messages.commonClose = 'mutated';
		}).toThrow();
	});
});
