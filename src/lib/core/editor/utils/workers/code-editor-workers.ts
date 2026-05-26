function makeWorker(path: string): Worker {
	return new Worker(new URL(path, import.meta.url), { type: 'module' });
}

export function initMonacoWorkers(): void {
	globalThis.MonacoEnvironment = {
		getWorker: function (_moduleId: string, label: string): Worker {
			switch (label) {
				case 'json':
					return makeWorker('monaco-editor/esm/vs/language/json/json.worker.js');

				case 'css':
				case 'scss':
				case 'less':
					return makeWorker('monaco-editor/esm/vs/language/css/css.worker.js');

				case 'html':
				case 'handlebars':
				case 'razor':
					return makeWorker('monaco-editor/esm/vs/language/html/html.worker.js');

				case 'typescript':
				case 'javascript':
					return makeWorker('monaco-editor/esm/vs/language/typescript/ts.worker.js');

				default:
					return makeWorker('monaco-editor/esm/vs/editor/editor.worker.js');
			}
		}
	};
}
