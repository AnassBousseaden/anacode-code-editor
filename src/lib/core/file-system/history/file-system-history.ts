import type {
	FileSystemCommand,
	FileSystemEvent
} from '$lib/core/file-system/domain/file-system-models';
import type { Readable } from 'svelte/store';

export interface IHistoryManager {
	readonly canUndo: Readable<boolean>;
	readonly canRedo: Readable<boolean>;

	push(event: FileSystemEvent): void;

	popUndo(): FileSystemEvent | null;

	popRedo(): FileSystemEvent | null;

	clear(): void;
}

export interface IEventInverter {
	/**
	 * Takes a committed transaction event and generates
	 * a "System Command" that reverses its effects.
	 * * Examples:
	 * - NodeCreated(A) -> DeleteNodeCommand(A)
	 * - NodeMoved(A, Old, New) -> MoveNodeCommand(A, New, Old)
	 * - NodeDeleted(A, [Children]) -> RestoreNodeCommand(A, [Children]) *Complex Case
	 */
	createInverseCommand(event: FileSystemEvent): FileSystemCommand;
}
