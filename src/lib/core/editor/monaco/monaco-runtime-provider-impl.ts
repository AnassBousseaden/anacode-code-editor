import type { EditorLocale } from '$lib/core/localization/localization-models';
import type {
	IMonacoRuntime,
	IMonacoRuntimeProvider,
	MonacoRuntimeLoadError
} from '$lib/core/editor/monaco/monaco-runtime';
import { MonacoRuntimeLoadErrorKind } from '$lib/core/editor/monaco/monaco-runtime';
import type { EditorLogEvent, IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';
import { ConsoleEditorLogger } from '$lib/core/shared/logger/editor-logger-impl';
import type { Result } from '$lib/core/shared/models-utils';
import { failure, success } from '$lib/core/shared/models-utils';
import { initMonacoWorkers } from '$lib/core/editor/utils/workers/code-editor-workers';
import { initCodeEditorThemes } from '$lib/core/editor/utils/themes/editor-themes';

enum MonacoCacheStateKind {
	NOT_LOADED = 'NOT_LOADED',
	LOADING = 'LOADING',
	AVAILABLE = 'AVAILABLE'
}

interface NotLoadedMonacoCache {
	readonly kind: MonacoCacheStateKind.NOT_LOADED;
}

interface LoadingMonacoCache {
	readonly kind: MonacoCacheStateKind.LOADING;
	readonly pending: Promise<Result<IMonacoRuntime, MonacoRuntimeLoadError>>;
	readonly locale: EditorLocale;
}

interface AvailableMonacoCache {
	readonly kind: MonacoCacheStateKind.AVAILABLE;
	readonly runtime: IMonacoRuntime;
	readonly locale: EditorLocale;
}

type MonacoCacheState = NotLoadedMonacoCache | LoadingMonacoCache | AvailableMonacoCache;

export class MonacoRuntimeProvider implements IMonacoRuntimeProvider {
	private readonly logger: IEditorLogger;
	private cache: MonacoCacheState;

	public constructor(logger: IEditorLogger = new ConsoleEditorLogger()) {
		this.logger = logger;
		this.cache = { kind: MonacoCacheStateKind.NOT_LOADED };
	}

	public load(
		locale: EditorLocale = 'en'
	): Promise<Result<IMonacoRuntime, MonacoRuntimeLoadError>> {
		if (this.cache.kind === MonacoCacheStateKind.NOT_LOADED) {
			const pending: Promise<Result<IMonacoRuntime, MonacoRuntimeLoadError>> =
				this.performLoad(locale);
			this.cache = { kind: MonacoCacheStateKind.LOADING, pending, locale };
			return pending;
		}

		if (locale !== this.cache.locale) {
			this.logger.log(buildLocaleAlreadyBoundEvent(locale, this.cache.locale));
		}

		if (this.cache.kind === MonacoCacheStateKind.LOADING) {
			return this.cache.pending;
		}

		return Promise.resolve(success(this.cache.runtime));
	}

	private async performLoad(
		locale: EditorLocale
	): Promise<Result<IMonacoRuntime, MonacoRuntimeLoadError>> {
		try {
			const runtime: IMonacoRuntime = await importMonacoRuntime(locale);
			this.cache = { kind: MonacoCacheStateKind.AVAILABLE, runtime, locale };
			return success(runtime);
		} catch (error: unknown) {
			this.cache = { kind: MonacoCacheStateKind.NOT_LOADED };
			return failure(buildLoadError(error));
		}
	}
}

// Monaco binds its UI locale page-wide at first evaluation: the NLS pack must
// finish importing before `monaco-editor` does.
async function importMonacoRuntime(locale: EditorLocale): Promise<IMonacoRuntime> {
	if (locale === 'fr') {
		// @ts-expect-error — monaco ships NLS packs as bare .js with no types.
		await import('monaco-editor/esm/nls.messages.fr.js');
	} else if (locale === 'es') {
		// @ts-expect-error — monaco ships NLS packs as bare .js with no types.
		await import('monaco-editor/esm/nls.messages.es.js');
	}

	const monaco: typeof import('monaco-editor') = await import('monaco-editor');
	initMonacoWorkers();
	initCodeEditorThemes(monaco.editor);

	return { editor: monaco.editor, Uri: monaco.Uri };
}

function buildLoadError(error: unknown): MonacoRuntimeLoadError {
	const causeMessage: string = error instanceof Error ? error.message : 'Unknown error';
	return {
		kind: MonacoRuntimeLoadErrorKind.LOAD_FAILED,
		message: `Failed to load the Monaco runtime: ${causeMessage}`
	};
}

function buildLocaleAlreadyBoundEvent(
	requestedLocale: EditorLocale,
	boundLocale: EditorLocale
): EditorLogEvent {
	return {
		scope: 'MonacoRuntimeProvider',
		event: 'LOCALE_ALREADY_BOUND',
		level: EditorLogLevel.WARN,
		data: {
			requestedLocale: requestedLocale,
			boundLocale: boundLocale
		}
	};
}
