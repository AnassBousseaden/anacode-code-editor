import type { Readable } from 'svelte/store';

import type { Result } from '$lib/core/shared/models-utils';

export enum LoadableKind {
	IDLE = 'IDLE',
	LOADING = 'LOADING',
	SUCCESS = 'SUCCESS',
	FAILURE = 'FAILURE'
}

export interface IdleLoadable {
	readonly kind: LoadableKind.IDLE;
}

export interface LoadingLoadable {
	readonly kind: LoadableKind.LOADING;
}

export interface SuccessLoadable<T> {
	readonly kind: LoadableKind.SUCCESS;
	readonly value: T;
}

export interface FailureLoadable<E> {
	readonly kind: LoadableKind.FAILURE;
	readonly error: E;
}

export type Loadable<T, E> =
	| IdleLoadable
	| LoadingLoadable
	| SuccessLoadable<T>
	| FailureLoadable<E>;

export interface ILoadable<T, E> {
	readonly state: Readable<Loadable<T, E>>;
}

export enum RefreshableKind {
	IDLE = 'IDLE',
	LOADING = 'LOADING',
	REFRESHING = 'REFRESHING',
	SUCCESS = 'SUCCESS',
	FAILURE = 'FAILURE'
}

export interface IdleRefreshable {
	readonly kind: RefreshableKind.IDLE;
}

export interface LoadingRefreshable {
	readonly kind: RefreshableKind.LOADING;
}

export interface RefreshingRefreshable<T> {
	readonly kind: RefreshableKind.REFRESHING;
	readonly previousValue: T;
}

export interface SuccessRefreshable<T> {
	readonly kind: RefreshableKind.SUCCESS;
	readonly value: T;
}

export interface FailureRefreshable<T, E> {
	readonly kind: RefreshableKind.FAILURE;
	readonly error: E;
	readonly previousValue: T | null;
}

export type Refreshable<T, E> =
	| IdleRefreshable
	| LoadingRefreshable
	| RefreshingRefreshable<T>
	| SuccessRefreshable<T>
	| FailureRefreshable<T, E>;

export interface IRefreshable<T, E> {
	readonly state: Readable<Refreshable<T, E>>;
}

export enum CommandStateKind {
	IDLE = 'IDLE',
	RUNNING = 'RUNNING',
	FAILED = 'FAILED'
}

export interface IdleCommandState {
	readonly kind: CommandStateKind.IDLE;
}

export interface RunningCommandState {
	readonly kind: CommandStateKind.RUNNING;
}

export interface FailedCommandState<E> {
	readonly kind: CommandStateKind.FAILED;
	readonly error: E;
}

export type CommandState<E> =
	| IdleCommandState
	| RunningCommandState
	| FailedCommandState<E>;

export enum CommandRejection {
	ALREADY_RUNNING = 'ALREADY_RUNNING'
}

export interface ICommand<P, T, E> {
	readonly state: Readable<CommandState<E>>;
	execute(params: P): Promise<Result<T, E | CommandRejection>>;
}

export type IVoidCommand<E> = ICommand<void, void, E>;

export type IInfallibleCommand<P, T> = ICommand<P, T, never>;
