export enum EditorLogLevel {
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR'
}

export type EditorLogValue = string | number | boolean | null;

export interface EditorLogEvent {
	readonly scope: string;
	readonly event: string;
	readonly level: EditorLogLevel;
	readonly data: Readonly<Record<string, EditorLogValue>>;
}

export interface IEditorLogger {
	log(event: EditorLogEvent): void;
}
