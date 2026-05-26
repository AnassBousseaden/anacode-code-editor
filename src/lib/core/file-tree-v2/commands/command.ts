import type { EditorSaveState } from '$lib/core/editor/save/editor-save-service';
import type { NodeID } from '$lib/core/file-system/domain/file-system-models';
import type { OperationFailure, Result } from '$lib/core/shared/models-utils';

export interface CommandDescriptor<TID extends string> {
	readonly id: TID;
	readonly label: string;
	readonly description?: string;
}

export enum CommandAvailabilityKind {
	AVAILABLE = 'available',
	UNAVAILABLE = 'unavailable'
}

export interface AvailableCommandAvailability {
	readonly kind: CommandAvailabilityKind.AVAILABLE;
}

export interface UnavailableCommandAvailability<TError extends OperationFailure<string>> {
	readonly kind: CommandAvailabilityKind.UNAVAILABLE;
	readonly reason: TError;
}

export type CommandAvailability<TError extends OperationFailure<string>> =
	| AvailableCommandAvailability
	| UnavailableCommandAvailability<TError>;

export interface AvailableInputCommandAvailability<TInput> {
	readonly kind: CommandAvailabilityKind.AVAILABLE;
	readonly initialInput: TInput;
}

export interface UnavailableInputCommandAvailability<TError extends OperationFailure<string>> {
	readonly kind: CommandAvailabilityKind.UNAVAILABLE;
	readonly reason: TError;
}

export type InputCommandAvailability<TInput, TError extends OperationFailure<string>> =
	| AvailableInputCommandAvailability<TInput>
	| UnavailableInputCommandAvailability<TError>;

export interface FileTreeSelectionContext {
	readonly selection: ReadonlyArray<NodeID>;
}

export enum EditorSelectionKind {
	NONE = 'none',
	ACTIVE_FILE = 'active-file'
}

export interface NoEditorSelection {
	readonly kind: EditorSelectionKind.NONE;
}

export interface ActiveFileEditorSelection {
	readonly kind: EditorSelectionKind.ACTIVE_FILE;
	readonly nodeID: NodeID;
}

export type EditorSelection = NoEditorSelection | ActiveFileEditorSelection;

export interface EditorSelectionContext {
	readonly editorSelection: EditorSelection;
}

export interface FileTreeCommandContext {
	readonly fileTreeSelection?: FileTreeSelectionContext;
	readonly editorSelection?: EditorSelectionContext;
	readonly editorSaveState?: EditorSaveState;
}

export interface ICommand<
	TID extends string,
	TResult,
	TError extends OperationFailure<string>
> {
	readonly descriptor: CommandDescriptor<TID>;

	getAvailability(commandContext: FileTreeCommandContext): CommandAvailability<TError>;

	perform(commandContext: FileTreeCommandContext): Promise<Result<TResult, TError>>;
}

export interface IInputCommand<
	TID extends string,
	TInput,
	TResult,
	TError extends OperationFailure<string>
> {
	readonly descriptor: CommandDescriptor<TID>;

	getAvailability(
		commandContext: FileTreeCommandContext
	): InputCommandAvailability<TInput, TError>;

	canPerform(commandContext: FileTreeCommandContext, performInput: TInput): Result<void, TError>;

	perform(
		commandContext: FileTreeCommandContext,
		performInput: TInput
	): Promise<Result<TResult, TError>>;
}
