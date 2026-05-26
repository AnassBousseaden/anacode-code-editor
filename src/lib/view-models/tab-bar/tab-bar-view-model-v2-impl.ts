import type { Readable } from 'svelte/store';

import type { IEditorIntentCommands } from '$lib/core/editor/intent/editor-intent-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type {
	ActiveBreadcrumb,
	TabList
} from '$lib/core/tab-bar/tab-projection-models';
import type { IObservableTabProjectionService } from '$lib/core/tab-bar/tab-projection-service';
import type { ITabBarViewModelV2 } from '$lib/view-models/tab-bar/tab-bar-view-model-v2';

export class TabBarViewModelV2 implements ITabBarViewModelV2 {
	public readonly openTabs: Readable<TabList>;
	public readonly activeBreadcrumb: Readable<ActiveBreadcrumb>;

	private readonly intentCommands: IEditorIntentCommands;

	constructor(
		tabProjection: IObservableTabProjectionService,
		intentCommands: IEditorIntentCommands
	) {
		this.intentCommands = intentCommands;
		this.openTabs = tabProjection.openTabs;
		this.activeBreadcrumb = tabProjection.activeBreadcrumb;
	}

	public selectTab(nodeID: NodeID): void {
		void this.intentCommands.open(nodeID);
	}

	public closeTab(nodeID: NodeID): void {
		void this.intentCommands.close(nodeID);
	}

	public dispose(): void {}
}
