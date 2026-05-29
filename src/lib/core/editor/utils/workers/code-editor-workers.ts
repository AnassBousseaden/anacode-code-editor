// Worker URLs must be inlined as static string literals here — Vite's
// static analyzer only resolves bare module specifiers like
// 'monaco-editor/...' when it sees them as literal arguments to
// `new URL(..., import.meta.url)`. Wrapping behind a helper that takes
// the path as a parameter defeats the analyzer; the bundler then treats
// the URL as a relative path against the current file's directory and
// 404s at runtime (.../workers/monaco-editor/esm/...).

function editorWorker(): Worker {
	return new Worker(
		new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
		{ type: 'module' }
	);
}

function jsonWorker(): Worker {
	return new Worker(
		new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
		{ type: 'module' }
	);
}

function cssWorker(): Worker {
	return new Worker(
		new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
		{ type: 'module' }
	);
}

function htmlWorker(): Worker {
	return new Worker(
		new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url),
		{ type: 'module' }
	);
}

function tsWorker(): Worker {
	return new Worker(
		new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
		{ type: 'module' }
	);
}

export function initMonacoWorkers(): void {
	globalThis.MonacoEnvironment = {
		getWorker: function (_moduleId: string, label: string): Worker {
			switch (label) {
				case 'json':
					return jsonWorker();

				case 'css':
				case 'scss':
				case 'less':
					return cssWorker();

				case 'html':
				case 'handlebars':
				case 'razor':
					return htmlWorker();

				case 'typescript':
				case 'javascript':
					return tsWorker();

				default:
					return editorWorker();
			}
		}
	};
}
