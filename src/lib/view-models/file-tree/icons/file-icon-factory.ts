import {
	createVSCodeFileIconFactory,
	type IVSCodeFileIconFactory,
	VSCodeFileIconFactory,
	type VSCodeFileIconName
} from '$lib/view-models/file-tree/icons/vscode-file-icon-factory';

export type FileIconName = VSCodeFileIconName;

export type IFileIconFactory = IVSCodeFileIconFactory;

export const FileIconFactory = VSCodeFileIconFactory;

export function createFileIconFactory(): IFileIconFactory {
	return createVSCodeFileIconFactory();
}
