import type { Readable } from 'svelte/store';

import type {
	ActiveBreadcrumb,
	TabList
} from '$lib/core/tab-bar/tab-projection-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export interface IObservableTabProjectionService {
	readonly openTabs: Readable<TabList>;
	readonly activeBreadcrumb: Readable<ActiveBreadcrumb>;
}

export interface ITabProjectionService
	extends IObservableTabProjectionService, IDisposable1 {}
