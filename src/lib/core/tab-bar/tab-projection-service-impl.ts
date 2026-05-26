import { derived, type Readable } from 'svelte/store';

import type { IObservableEditorIntentState } from '$lib/core/editor/intent/editor-intent-service';
import type { IEditorDocumentService } from '$lib/core/editor/document-lifecycle/editor-document-service';
import type {
	ISavableEditorDocument,
	SavableEditorDocumentOptions
} from '$lib/core/editor/document/savable-editor-document';
import {
	type DocumentState,
	DocumentStateKind
} from '$lib/core/code-editor/editor-orchestration-models';
import type {
	DirtyEntry,
	IObservableEditorSaveState
} from '$lib/core/editor/save/editor-save-service';
import type { SaveEntryKind } from '$lib/core/editor/save/registry/draft-registry';
import type {
	FileSystemMapReadonly,
	FileSystemNode,
	NodeID,
	UserSpaceTag
} from '$lib/core/file-system/domain/file-system-models';
import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
import {
	ABSENT_ACTIVE_BREADCRUMB,
	type ActiveBreadcrumb,
	ActiveBreadcrumbKind,
	type BreadcrumbSegment,
	CLEAN_TAB_SAVE_STATUS,
	type DirtyTabSaveStatus,
	EMPTY_TAB_LIST,
	type ForeignTabUserSpace,
	type NonEmptyTabList,
	type OpenTabSnapshot,
	OWN_TAB_USER_SPACE,
	type PresentActiveBreadcrumb,
	type TabList,
	TabListKind,
	type TabSaveStatus,
	TabSaveStatusKind,
	type TabUserSpace,
	TabUserSpaceKind
} from '$lib/core/tab-bar/tab-projection-models';
import type { ITabProjectionService } from '$lib/core/tab-bar/tab-projection-service';

function buildDirtyStatusByNodeID(
	dirtyEntries: ReadonlyArray<DirtyEntry>
): ReadonlyMap<NodeID, SaveEntryKind> {
	const dirtyStatusByNodeID: Map<NodeID, SaveEntryKind> = new Map<NodeID, SaveEntryKind>();
	for (const dirtyEntry of dirtyEntries) {
		dirtyStatusByNodeID.set(dirtyEntry.nodeID, dirtyEntry.status);
	}
	return dirtyStatusByNodeID;
}

function projectSaveStatus(dirtyEntryKind: SaveEntryKind | undefined): TabSaveStatus {
	if (dirtyEntryKind === undefined) {
		return CLEAN_TAB_SAVE_STATUS;
	}
	const dirtyStatus: DirtyTabSaveStatus = {
		kind: TabSaveStatusKind.DIRTY,
		entryKind: dirtyEntryKind
	};
	return dirtyStatus;
}

function projectUserSpace(userSpaceTag: UserSpaceTag | null): TabUserSpace {
	if (userSpaceTag === null) {
		return OWN_TAB_USER_SPACE;
	}
	const foreignUserSpace: ForeignTabUserSpace = {
		kind: TabUserSpaceKind.FOREIGN,
		tag: userSpaceTag
	};
	return foreignUserSpace;
}

function splitAbsolutePathIntoSegments(absolutePath: string): ReadonlyArray<BreadcrumbSegment> {
	const segmentNames: string[] = absolutePath
		.split('/')
		.filter((segmentName: string): boolean => segmentName.length > 0);

	const segments: BreadcrumbSegment[] = [];
	let accumulatedPath: string = '';

	for (let segmentIndex: number = 0; segmentIndex < segmentNames.length; segmentIndex++) {
		const segmentName: string = segmentNames[segmentIndex];
		accumulatedPath = accumulatedPath + '/' + segmentName;
		const isFileSegment: boolean = segmentIndex === segmentNames.length - 1;
		const segment: BreadcrumbSegment = {
			name: segmentName,
			fullPath: accumulatedPath,
			isFile: isFileSegment
		};
		segments.push(segment);
	}

	return segments;
}

function extractActiveNodeID(state: DocumentState): NodeID | null {
	if (state.kind === DocumentStateKind.NONE) {
		return null;
	}
	return state.nodeID;
}

function deriveFallbackName(doc: ISavableEditorDocument): string {
	const options: SavableEditorDocumentOptions = doc.getDocumentOptions();
	const fileURI: string = options.fileURI;
	const lastSlashIndex: number = fileURI.lastIndexOf('/');
	if (lastSlashIndex === -1) {
		return fileURI;
	}
	return fileURI.slice(lastSlashIndex + 1);
}

export class TabProjectionService implements ITabProjectionService {
	public readonly openTabs: Readable<TabList>;
	public readonly activeBreadcrumb: Readable<ActiveBreadcrumb>;

	private readonly fileSystemService: IFileSystemService;
	private readonly editorDocumentService: IEditorDocumentService;

	constructor(
		intentState: IObservableEditorIntentState,
		fileSystemService: IFileSystemService,
		saveState: IObservableEditorSaveState,
		editorDocumentService: IEditorDocumentService
	) {
		this.fileSystemService = fileSystemService;
		this.editorDocumentService = editorDocumentService;

		this.openTabs = derived(
			[
				intentState.openDocumentIDs,
				intentState.activeDocument,
				fileSystemService.fileSystemMap,
				saveState.dirtyEntries
			],
			([openDocumentIDs, activeDocument, _fileSystemMapTrigger, dirtyEntries]: [
				ReadonlyArray<NodeID>,
				DocumentState,
				FileSystemMapReadonly,
				ReadonlyArray<DirtyEntry>
			]): TabList => {
				void _fileSystemMapTrigger;
				return this.buildOpenTabs(openDocumentIDs, activeDocument, dirtyEntries);
			}
		);

		this.activeBreadcrumb = derived(
			[intentState.activeDocument, fileSystemService.fileSystemMap],
			([activeDocument, _fileSystemMapTrigger]: [
				DocumentState,
				FileSystemMapReadonly
			]): ActiveBreadcrumb => {
				void _fileSystemMapTrigger;
				return this.buildActiveBreadcrumb(activeDocument);
			}
		);
	}

	public dispose(): void {}

	private buildOpenTabs(
		openDocumentIDs: ReadonlyArray<NodeID>,
		activeDocument: DocumentState,
		dirtyEntries: ReadonlyArray<DirtyEntry>
	): TabList {
		const dirtyStatusByNodeID: ReadonlyMap<NodeID, SaveEntryKind> =
			buildDirtyStatusByNodeID(dirtyEntries);
		const activeNodeID: NodeID | null = extractActiveNodeID(activeDocument);

		const snapshots: OpenTabSnapshot[] = [];

		for (const nodeID of openDocumentIDs) {
			const snapshot: OpenTabSnapshot | null = this.buildTabSnapshot(
				nodeID,
				activeNodeID,
				dirtyStatusByNodeID
			);
			if (snapshot === null) {
				continue;
			}
			snapshots.push(snapshot);
		}

		if (snapshots.length === 0) {
			return EMPTY_TAB_LIST;
		}

		const nonEmpty: NonEmptyTabList = {
			kind: TabListKind.NON_EMPTY,
			tabs: snapshots
		};
		return nonEmpty;
	}

	private buildTabSnapshot(
		nodeID: NodeID,
		activeNodeID: NodeID | null,
		dirtyStatusByNodeID: ReadonlyMap<NodeID, SaveEntryKind>
	): OpenTabSnapshot | null {
		const node: FileSystemNode | null = this.fileSystemService.getNode(nodeID);
		const isActive: boolean = activeNodeID === nodeID;
		const saveStatus: TabSaveStatus = projectSaveStatus(dirtyStatusByNodeID.get(nodeID));

		if (node !== null) {
			const snapshot: OpenTabSnapshot = {
				nodeID: nodeID,
				name: node.name,
				isActive: isActive,
				isReadOnly: !node.permissions.write,
				saveStatus: saveStatus,
				userSpace: projectUserSpace(node.userSpace)
			};
			return snapshot;
		}

		const loadedDoc: ISavableEditorDocument | null =
			this.editorDocumentService.getLoaded(nodeID);
		if (loadedDoc === null) {
			return null;
		}

		const snapshot: OpenTabSnapshot = {
			nodeID: nodeID,
			name: deriveFallbackName(loadedDoc),
			isActive: isActive,
			isReadOnly: true,
			saveStatus: saveStatus,
			userSpace: OWN_TAB_USER_SPACE
		};
		return snapshot;
	}

	private buildActiveBreadcrumb(activeDocument: DocumentState): ActiveBreadcrumb {
		const activeNodeID: NodeID | null = extractActiveNodeID(activeDocument);

		if (activeNodeID === null) {
			return ABSENT_ACTIVE_BREADCRUMB;
		}

		const absolutePath: string = this.fileSystemService.getAbsolutePath(activeNodeID);

		const segments: ReadonlyArray<BreadcrumbSegment> =
			splitAbsolutePathIntoSegments(absolutePath);

		const present: PresentActiveBreadcrumb = {
			kind: ActiveBreadcrumbKind.PRESENT,
			segments: segments
		};
		return present;
	}
}
