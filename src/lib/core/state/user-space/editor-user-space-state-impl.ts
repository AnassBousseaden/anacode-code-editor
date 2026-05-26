import type { Readable, Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';

import type { UserSpaceTag } from '$lib/core/file-system/domain/file-system-models';
import type { IEditorUserSpaceStateService } from '$lib/core/state/user-space/editor-user-space-state';

export class EditorUserSpaceStateService implements IEditorUserSpaceStateService {
	private readonly _activeUserSpace: Writable<UserSpaceTag | null>;

	constructor(initialActiveUserSpace: UserSpaceTag | null = null) {
		this._activeUserSpace = writable<UserSpaceTag | null>(initialActiveUserSpace);
	}

	get activeUserSpace(): Readable<UserSpaceTag | null> {
		return this._activeUserSpace;
	}

	setActiveUserSpace(userSpace: UserSpaceTag | null): void {
		this._activeUserSpace.set(userSpace);
	}

	getActiveUserSpace(): UserSpaceTag | null {
		return get(this._activeUserSpace);
	}
}
