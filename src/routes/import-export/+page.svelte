<script lang="ts">
	import { CircleAlert, Download, FilePlus, LoaderCircle, Upload } from '@lucide/svelte';

	import EditorSession from '$lib/components/EditorSession.svelte';
	import {
		StaticDefaultEditorConfigurationService,
		type IEditorConfigurationService
	} from '$lib/core/editor/configuration/editor-config-models';
	import {
		type FileSystemMapReadonly,
		type NodeID,
		ROOT_NODE_ID
	} from '$lib/core/file-system/domain/file-system-models';
	import type { ZipExportError } from '$lib/core/file-system/persistance/export/file-system-exporter';
	import { ZipBrowserDownloadStrategy } from '$lib/core/file-system/persistance/export/file-system-export-strategy-impls';
	import type { IFileSystemZipCoordinator } from '$lib/core/file-system/persistance/file-system-coordinator';
	import { FileSystemZipCoordinator } from '$lib/core/file-system/persistance/file-system-coordinator-impl';
	import type {
		ImportedFileSystemState,
		ZipImportError
	} from '$lib/core/file-system/persistance/import/file-system-import';
	import { FileSystemZipImporter } from '$lib/core/file-system/persistance/import/file-system-importer-impl';
	import { ZipFileInputStrategy } from '$lib/core/file-system/persistance/import/file-system-importer-strategy-impls';
	import type {
		CreateEditorSessionError,
		IEditorSession
	} from '$lib/core/session/editor-session';
	import { EditorSessionFactory } from '$lib/core/session/editor-session-factory-impl';
	import type { Result } from '$lib/core/shared/models-utils';
	import { initMonacoWorkers } from '$lib/core/editor/utils/workers/code-editor-workers';
	import { Button } from '$lib/ui-primitives/button';
	import {
		Content as CardContent,
		Description as CardDescription,
		Header as CardHeader,
		Root as CardRoot,
		Title as CardTitle
	} from '$lib/ui-primitives/card';

	type UIState = 'idle' | 'loading' | 'active';

	let uiState: UIState = $state('idle');
	let session: IEditorSession | null = $state(null);
	let currentFileSystemMap: FileSystemMapReadonly | null = $state(null);
	let rootNodeID: NodeID = $state(ROOT_NODE_ID);
	let isDragging: boolean = $state(false);
	let errorMessage: string | null = $state(null);
	let loadingMessage: string = $state('');

	let fileInputElement: HTMLInputElement;

	const codeEditorConfigurationService: IEditorConfigurationService =
		new StaticDefaultEditorConfigurationService();
	const coordinator: IFileSystemZipCoordinator = new FileSystemZipCoordinator();
	const sessionFactory: EditorSessionFactory = new EditorSessionFactory(
		new FileSystemZipImporter()
	);

	initMonacoWorkers();

	function transitionToLoading(message: string): void {
		uiState = 'loading';
		loadingMessage = message;
		errorMessage = null;
	}

	async function transitionToActive(
		state: FileSystemMapReadonly,
		nodeID: NodeID
	): Promise<void> {
		const result: Result<IEditorSession, CreateEditorSessionError> =
			await sessionFactory.createFromFileSystemMap(state, codeEditorConfigurationService);
		if (!result.ok) {
			handleError(new Error(result.error.message));
			return;
		}

		if (session !== null) {
			session.dispose();
		}
		session = result.value;
		currentFileSystemMap = state;
		rootNodeID = nodeID;
		uiState = 'active';
		loadingMessage = '';
	}

	function transitionToIdle(): void {
		if (session !== null) {
			session.dispose();
			session = null;
		}
		currentFileSystemMap = null;
		uiState = 'idle';
		loadingMessage = '';
	}

	function handleError(error: Error | ZipImportError | ZipExportError): void {
		errorMessage = error.message;
		uiState = session !== null ? 'active' : 'idle';
		loadingMessage = '';
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent): void {
		event.preventDefault();
		isDragging = false;
	}

	async function handleDrop(event: DragEvent): Promise<void> {
		event.preventDefault();
		isDragging = false;
		const files: FileList | undefined = event.dataTransfer?.files;
		if (files === undefined || files.length === 0) return;
		const file: File = files[0];
		if (!file.name.endsWith('.zip')) {
			errorMessage = 'Please drop a .zip file';
			return;
		}
		await importFromFile(file);
	}

	async function importFromFile(file: File): Promise<void> {
		transitionToLoading('Extracting files...');
		const strategy: ZipFileInputStrategy = new ZipFileInputStrategy();
		const result: Result<ImportedFileSystemState, ZipImportError | Error> =
			await coordinator.import(file, strategy);
		if (!result.ok) {
			handleError(result.error);
			return;
		}
		const importedState: ImportedFileSystemState = result.value;
		await transitionToActive(importedState.fileSystemMap, importedState.rootNodeID);
	}

	async function exportProject(): Promise<void> {
		if (currentFileSystemMap === null) return;
		transitionToLoading('Compressing project...');
		const strategy: ZipBrowserDownloadStrategy = new ZipBrowserDownloadStrategy('project.zip');
		const result: Result<void, ZipExportError | Error> = await coordinator.export(
			currentFileSystemMap,
			{ rootNodeID: rootNodeID },
			strategy
		);
		if (!result.ok) {
			handleError(result.error);
			return;
		}
		uiState = 'active';
		loadingMessage = '';
	}

	function handleFileSelect(event: Event): void {
		const target: HTMLInputElement = event.target as HTMLInputElement;
		const files: FileList | null = target.files;
		if (files === null || files.length === 0) return;
		const file: File = files[0];
		if (!file.name.endsWith('.zip')) {
			errorMessage = 'Please select a .zip file';
			return;
		}
		void importFromFile(file);
		target.value = '';
	}

	function triggerFileSelect(): void {
		fileInputElement.click();
	}

	function dismissError(): void {
		errorMessage = null;
	}
</script>

<div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
	{#if errorMessage !== null}
		<div
			class="m-2 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
		>
			<CircleAlert class="mt-0.5 size-4 shrink-0" />
			<div class="flex flex-1 items-center justify-between gap-3">
				<span>{errorMessage}</span>
				<Button variant="ghost" size="sm" onclick={dismissError}>Dismiss</Button>
			</div>
		</div>
	{/if}

	{#if uiState === 'idle'}
		<div class="flex flex-1 items-center justify-center p-8">
			<CardRoot class="w-full max-w-2xl">
				<CardHeader>
					<CardTitle class="text-center text-2xl">Import Project</CardTitle>
					<CardDescription class="text-center">
						Drag and drop a ZIP file or click to browse
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div
						class="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors {isDragging
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/25 hover:border-muted-foreground/50'}"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
						onclick={triggerFileSelect}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && triggerFileSelect()}
					>
						<Upload class="mb-4 size-12 text-muted-foreground" />
						<p class="text-lg font-medium text-foreground">Drop ZIP file here</p>
						<p class="text-sm text-muted-foreground">or click to browse</p>
					</div>

					<input
						bind:this={fileInputElement}
						type="file"
						accept=".zip"
						class="hidden"
						onchange={handleFileSelect}
					/>
				</CardContent>
			</CardRoot>
		</div>
	{:else if uiState === 'loading'}
		<div class="flex flex-1 flex-col items-center justify-center gap-4">
			<LoaderCircle class="size-12 animate-spin text-primary" />
			<p class="text-lg font-medium text-foreground">{loadingMessage}</p>
		</div>
	{:else if uiState === 'active' && session !== null}
		<div class="flex items-center justify-between border-b border-border bg-card px-4 py-2">
			<Button variant="ghost" size="sm" onclick={transitionToIdle}>
				<FilePlus class="mr-2 size-4" />
				New Project
			</Button>
			<Button variant="default" size="sm" onclick={exportProject}>
				<Download class="mr-2 size-4" />
				Download ZIP
			</Button>
		</div>

		<div class="relative min-h-0 w-full flex-1 overflow-hidden">
			<EditorSession {session} />
		</div>
	{/if}
</div>
