import type { Readable } from 'svelte/store';

import type { UserSpaceTag } from '$lib/core/file-system/domain/file-system-models';

export interface IEditorUserSpaceObservable {
	readonly activeUserSpace: Readable<UserSpaceTag | null>;
}

export interface IEditorUserSpaceStateService extends IEditorUserSpaceObservable {
	setActiveUserSpace(userSpace: UserSpaceTag | null): void;
	getActiveUserSpace(): UserSpaceTag | null;
}
