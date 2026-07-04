import { describe, expect, it } from 'vitest';

import {
	resolveEditorMessages,
	type EditorMessages
} from '$lib/core/localization/localization-models';
import { DUPLICATE_NAME_ERROR_CODE } from '$lib/core/file-system/commands/file-system-commands-impl-utils';
import {
	FileTreeActionErrorKind,
	FileTreeActionID,
	type FileTreeActionError
} from '$lib/core/file-tree-v2/commands/file-system/file-tree-action';
import {
	resolveFileTreeActionErrorContent,
	resolveFileTreeActionLabel
} from '$lib/view-models/file-tree/localization/file-tree-action-messages';

const messages: EditorMessages = resolveEditorMessages();

describe('resolveFileTreeActionLabel', () => {
	it('maps every action id to a non-empty localized label', () => {
		for (const id of Object.values(FileTreeActionID)) {
			expect(resolveFileTreeActionLabel(messages, id)).not.toBe('');
		}
	});

	it('resolves the create-file label', () => {
		expect(resolveFileTreeActionLabel(messages, FileTreeActionID.CREATE_FILE)).toBe('Create File');
	});
});

describe('resolveFileTreeActionErrorContent', () => {
	it('maps a kind to its generic localized content, ignoring the diagnostic message', () => {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.MISSING_NAME,
			message: 'A name is required.'
		};
		expect(resolveFileTreeActionErrorContent(messages, error)).toBe('A name is required.');
	});

	it('interpolates the conflicting name for a duplicate-name file-system error', () => {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.FILE_SYSTEM_ERROR,
			message: 'File system error: ...',
			params: { name: 'index.ts' },
			code: DUPLICATE_NAME_ERROR_CODE
		};
		expect(resolveFileTreeActionErrorContent(messages, error)).toBe(
			'A file or folder named "index.ts" already exists.'
		);
	});

	it('does not trigger the name-exists message from a name param alone (no duplicate-name code)', () => {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.FILE_SYSTEM_ERROR,
			message: 'File system error: ...',
			params: { name: 'index.ts' }
		};
		expect(resolveFileTreeActionErrorContent(messages, error)).toBe(
			'A file system error occurred.'
		);
	});

	it('falls back to the generic file-system message when no code is present', () => {
		const error: FileTreeActionError = {
			kind: FileTreeActionErrorKind.FILE_SYSTEM_ERROR,
			message: 'File system error: ...'
		};
		expect(resolveFileTreeActionErrorContent(messages, error)).toBe(
			'A file system error occurred.'
		);
	});
});
