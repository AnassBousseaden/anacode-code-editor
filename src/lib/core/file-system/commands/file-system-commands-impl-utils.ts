import { invalid, valid } from '$lib/core/file-system/domain/file-system-computation-models';
import {
	type FileSystemMapReadonly,
	type FileSystemNode,
	type FolderNode,
	type NodeID,
	type ValidationResult
} from '$lib/core/file-system/domain/file-system-models';
import { ErrorMessages } from '$lib/core/file-system/domain/errors/file-system-model-errors-registry';

/**
 * Validates that a node name is valid.
 * Names cannot be empty or contain path separators.
 */
export function validateNodeName(name: string): ValidationResult<void> {
	const trimmedName: string = name.trim();

	if (trimmedName.length === 0) {
		return invalid(ErrorMessages.EMPTY_NAME());
	}

	const invalidChars: RegExp = /[/\\:*?"<>|]/;
	const hasInvalidChars: boolean = invalidChars.test(trimmedName);

	if (hasInvalidChars) {
		return invalid(ErrorMessages.INVALID_NAME(name));
	}

	return valid(undefined);
}

/**
 * Checks if a name already exists among siblings in a folder.
 */
export function checkNameCollision(
	parentNode: FolderNode,
	name: string,
	state: FileSystemMapReadonly,
	excludeNodeID?: NodeID
): ValidationResult<void> {
	const childrenIDs: ReadonlyArray<NodeID> = parentNode.children;

	for (const childID of childrenIDs) {
		if (excludeNodeID !== undefined && childID === excludeNodeID) {
			continue;
		}

		const childNode: FileSystemNode | undefined = state[childID];
		if (childNode === undefined) {
			continue;
		}

		const childName: string = childNode.name;
		if (childName === name) {
			return invalid(ErrorMessages.NAME_EXISTS(name));
		}
	}

	return valid(undefined);
}
