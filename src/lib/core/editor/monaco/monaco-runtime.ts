import type { editor, Uri } from 'monaco-editor';
import type { EditorLocale } from '$lib/core/localization/localization-models';
import type { OperationFailure, Result } from '$lib/core/shared/models-utils';

export type MonacoEditorNamespace = typeof editor;
export type MonacoUriClass = typeof Uri;

export interface IMonacoRuntime {
	readonly editor: MonacoEditorNamespace;
	readonly Uri: MonacoUriClass;
}

export enum MonacoRuntimeLoadErrorKind {
	LOAD_FAILED = 'LOAD_FAILED'
}

export type MonacoRuntimeLoadError = OperationFailure<MonacoRuntimeLoadErrorKind>;

export interface IMonacoRuntimeProvider {
	load(locale?: EditorLocale): Promise<Result<IMonacoRuntime, MonacoRuntimeLoadError>>;
}
