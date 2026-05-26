import type {
	EditorLogEvent,
	IEditorLogger
} from '$lib/core/shared/logger/editor-logger';
import { EditorLogLevel } from '$lib/core/shared/logger/editor-logger';

export class ConsoleEditorLogger implements IEditorLogger {
	public log(event: EditorLogEvent): void {
		const prefix: string = `[${event.scope}] ${event.event}`;
		if (event.level === EditorLogLevel.ERROR) {
			console.error(prefix, event.data);
			return;
		}
		if (event.level === EditorLogLevel.WARN) {
			console.warn(prefix, event.data);
			return;
		}
		console.info(prefix, event.data);
	}
}
