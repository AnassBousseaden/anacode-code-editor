import type { Readable } from 'svelte/store';

import {
	type FileNode,
	type FolderNode,
	NodeType
} from '$lib/core/file-system/domain/file-system-models';
import type { IDisposable1 } from '$lib/core/shared/models-utils';

export enum FileSaveStatus {
	CLEAN = 'CLEAN',
	SAVEABLE = 'SAVEABLE',
	CONFLICTED = 'CONFLICTED',
	INVALID = 'INVALID'
}

export interface FileTreeItemFile {
	readonly type: NodeType.FILE;
	readonly node: FileNode;
	readonly depth: number;
	readonly isSelected: boolean;
	readonly isVisible: boolean;
	readonly isForeignUserSpace: boolean;
	readonly isDragged: boolean;
	readonly isDropTarget: boolean;
	readonly isInvalidDropTarget: boolean;
	readonly isActive: boolean;
	readonly saveStatus: FileSaveStatus;
}

export interface FileTreeItemFolder {
	readonly type: NodeType.FOLDER;
	readonly node: FolderNode;
	readonly depth: number;
	readonly isSelected: boolean;
	readonly isVisible: boolean;
	readonly isForeignUserSpace: boolean;
	readonly isDragged: boolean;
	readonly isDropTarget: boolean;
	readonly isInvalidDropTarget: boolean;
	readonly isExpanded: boolean;
	readonly hasChildren: boolean;
}

export type FileTreeItem = FileTreeItemFile | FileTreeItemFolder;

export interface IFileTreeProjection extends IDisposable1 {
	readonly items: Readable<ReadonlyArray<FileTreeItem>>;
}
