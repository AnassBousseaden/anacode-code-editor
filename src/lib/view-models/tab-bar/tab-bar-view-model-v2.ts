import type { Readable } from 'svelte/store';

import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';
import type {
	ActiveBreadcrumb,
	TabList
} from '$lib/core/tab-bar/tab-projection-models';

export interface ITabBarViewModelV2 extends IDisposable1 {
	readonly openTabs: Readable<TabList>;
	readonly activeBreadcrumb: Readable<ActiveBreadcrumb>;

	selectTab(nodeID: NodeID): void;

	closeTab(nodeID: NodeID): void;
}
