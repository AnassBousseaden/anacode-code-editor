import type {
	NodeID,
	UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import type { SaveEntryKind } from '$lib/core/editor/save/registry/draft-registry';

export enum TabSaveStatusKind {
	CLEAN = 'CLEAN',
	DIRTY = 'DIRTY'
}

export interface CleanTabSaveStatus {
	readonly kind: TabSaveStatusKind.CLEAN;
}

export interface DirtyTabSaveStatus {
	readonly kind: TabSaveStatusKind.DIRTY;
	readonly entryKind: SaveEntryKind;
}

export type TabSaveStatus = CleanTabSaveStatus | DirtyTabSaveStatus;

export const CLEAN_TAB_SAVE_STATUS: CleanTabSaveStatus = {
	kind: TabSaveStatusKind.CLEAN
};

export enum TabUserSpaceKind {
	OWN = 'OWN',
	FOREIGN = 'FOREIGN'
}

export interface OwnTabUserSpace {
	readonly kind: TabUserSpaceKind.OWN;
}

export interface ForeignTabUserSpace {
	readonly kind: TabUserSpaceKind.FOREIGN;
	readonly tag: UserSpaceTag;
}

export type TabUserSpace = OwnTabUserSpace | ForeignTabUserSpace;

export const OWN_TAB_USER_SPACE: OwnTabUserSpace = {
	kind: TabUserSpaceKind.OWN
};

export interface OpenTabSnapshot {
	readonly nodeID: NodeID;
	readonly name: string;
	readonly isActive: boolean;
	readonly isReadOnly: boolean;
	readonly saveStatus: TabSaveStatus;
	readonly userSpace: TabUserSpace;
}

export interface BreadcrumbSegment {
	readonly name: string;
	readonly fullPath: string;
	readonly isFile: boolean;
}

export enum TabListKind {
	EMPTY = 'EMPTY',
	NON_EMPTY = 'NON_EMPTY'
}

export interface EmptyTabList {
	readonly kind: TabListKind.EMPTY;
}

export interface NonEmptyTabList {
	readonly kind: TabListKind.NON_EMPTY;
	readonly tabs: ReadonlyArray<OpenTabSnapshot>;
}

export type TabList = EmptyTabList | NonEmptyTabList;

export const EMPTY_TAB_LIST: EmptyTabList = {
	kind: TabListKind.EMPTY
};

export enum ActiveBreadcrumbKind {
	ABSENT = 'ABSENT',
	PRESENT = 'PRESENT'
}

export interface AbsentActiveBreadcrumb {
	readonly kind: ActiveBreadcrumbKind.ABSENT;
}

export interface PresentActiveBreadcrumb {
	readonly kind: ActiveBreadcrumbKind.PRESENT;
	readonly segments: ReadonlyArray<BreadcrumbSegment>;
}

export type ActiveBreadcrumb = AbsentActiveBreadcrumb | PresentActiveBreadcrumb;

export const ABSENT_ACTIVE_BREADCRUMB: AbsentActiveBreadcrumb = {
	kind: ActiveBreadcrumbKind.ABSENT
};
