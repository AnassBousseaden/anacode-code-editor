import type { IEditorLogger } from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';

const LOG_SCOPE: string = 'editor-lifecycle-waitable';

export interface IWaitable {
	waitUntil(promise: Promise<void>): void;
}

export class WaitableCollector implements IWaitable {
	private readonly pending: Promise<void>[];
	private readonly logger: IEditorLogger;
	private readonly eventName: string;

	public constructor(logger: IEditorLogger, eventName: string) {
		this.pending = [];
		this.logger = logger;
		this.eventName = eventName;
	}

	public readonly waitUntil = (promise: Promise<void>): void => {
		this.pending.push(promise);
	};

	public async awaitAll(): Promise<void> {
		if (this.pending.length === 0) {
			return;
		}
		const results: PromiseSettledResult<void>[] = await Promise.allSettled(this.pending);
		for (const result of results) {
			if (result.status === 'rejected') {
				const reason: unknown = result.reason;
				const message: string = reason instanceof Error ? reason.message : String(reason);
				this.logger.log({
					scope: LOG_SCOPE,
					event: 'participant.rejected',
					level: EditorLogLevel.WARN,
					data: {
						eventName: this.eventName,
						message: message
					}
				});
			}
		}
	}
}
