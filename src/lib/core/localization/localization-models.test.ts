import { describe, expect, it } from 'vitest';

import {
	formatMessage,
	resolveEditorMessages,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import { en } from '$lib/core/localization/messages/en';
import { es } from '$lib/core/localization/messages/es';

describe('resolveEditorMessages', () => {
	it('returns the full English catalog when no options are given', () => {
		const messages: EditorMessages = resolveEditorMessages();
		expect(messages).toEqual(en);
	});

	it('returns the English catalog for an English locale', () => {
		const messages: EditorMessages = resolveEditorMessages({ locale: 'en' });
		expect(messages['common.close']).toBe('Close');
	});

	it('overlays the selected locale over English', () => {
		// es carries Spanish translations that win over the English base.
		const messages: EditorMessages = resolveEditorMessages({ locale: 'es' });
		expect(messages['common.cancel']).toBe(es['common.cancel']);
		expect(messages['common.close']).toBe(es['common.close']);
		expect(messages['common.retry']).toBe(es['common.retry']);
	});

	it('applies consumer overrides with the highest precedence', () => {
		const messages: EditorMessages = resolveEditorMessages({
			locale: 'es',
			overrides: { 'common.close': 'Dismiss' }
		});
		expect(messages['common.close']).toBe('Dismiss');
		// Non-overridden keys still resolve from the selected es overlay.
		expect(messages['common.cancel']).toBe(es['common.cancel']);
	});

	it('lets overrides win over the selected locale', () => {
		const messages: EditorMessages = resolveEditorMessages({
			locale: 'es',
			overrides: { 'common.retry': 'Try again' }
		});
		expect(messages['common.retry']).toBe('Try again');
	});

	it('returns a frozen record that cannot be mutated', () => {
		const messages: EditorMessages = resolveEditorMessages();
		expect(Object.isFrozen(messages)).toBe(true);
		expect(() => {
			// @ts-expect-error — intentionally probing runtime immutability.
			messages['common.close'] = 'mutated';
		}).toThrow();
	});
});

describe('formatMessage', () => {
	it('substitutes a single token', () => {
		expect(formatMessage('Close {name}', { name: 'index.ts' })).toBe('Close index.ts');
	});

	it('substitutes multiple tokens', () => {
		expect(formatMessage('Move {from} to {to}', { from: 'a', to: 'b' })).toBe('Move a to b');
	});

	it('leaves unknown tokens intact', () => {
		expect(formatMessage('Hello {name}, {missing}', { name: 'world' })).toBe(
			'Hello world, {missing}'
		);
	});

	it('returns the template unchanged when no params are given', () => {
		expect(formatMessage('Close {name}')).toBe('Close {name}');
	});

	it('stringifies numeric params', () => {
		expect(formatMessage('{count} hidden', { count: 3 })).toBe('3 hidden');
	});
});
