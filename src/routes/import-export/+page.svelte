<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CircleAlert, Download, FilePlus, LoaderCircle, Upload } from '@lucide/svelte';

	import EditorSession from '$lib/components/EditorSession.svelte';
	import type { IEditorConfigurationService } from '$lib/core/editor/configuration/editor-config-models';
	import { EditorConfigurationService } from '../../playground/editor-config.svelte';
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
	import {
		Description as AlertDescription,
		Root as AlertRoot,
		Title as AlertTitle
	} from '$lib/ui-primitives/alert';
	import { Badge, type BadgeVariant } from '$lib/ui-primitives/badge';
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
		EditorConfigurationService.getInstance();
	const coordinator: IFileSystemZipCoordinator = new FileSystemZipCoordinator();
	const sessionFactory: EditorSessionFactory = new EditorSessionFactory(
		new FileSystemZipImporter()
	);

	initMonacoWorkers();

	onDestroy((): void => {
		if (session !== null) {
			session.dispose();
		}
	});

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

	type PresetTier = 'bigger' | 'big' | 'medium' | 'light';

	interface PresetProject {
		readonly label: string;
		readonly description: string;
		readonly url: string;
		readonly sizeLabel: string;
		readonly tier: PresetTier;
	}

	const TIER_VARIANT: Record<PresetTier, BadgeVariant> = {
		bigger: 'destructive',
		big: 'default',
		medium: 'secondary',
		light: 'outline'
	};

	const PRESETS: ReadonlyArray<PresetProject> = [
		{
			label: 'FastAPI',
			description: 'tiangolo/fastapi · MIT',
			url: '/projects/fastapi.zip',
			sizeLabel: '19 MB',
			tier: 'bigger'
		},
		{
			label: 'Resilience4j',
			description: 'resilience4j/resilience4j · Apache 2.0',
			url: '/projects/resilience4j.zip',
			sizeLabel: '2.1 MB',
			tier: 'big'
		},
		{
			label: 'Caddy',
			description: 'caddyserver/caddy · Apache 2.0',
			url: '/projects/caddy.zip',
			sizeLabel: '1.2 MB',
			tier: 'medium'
		},
		{
			label: 'Cobra',
			description: 'spf13/cobra · Apache 2.0',
			url: '/projects/cobra.zip',
			sizeLabel: '234 KB',
			tier: 'light'
		}
	];

	async function loadPreset(preset: PresetProject): Promise<void> {
		transitionToLoading(`Downloading ${preset.label}...`);
		try {
			const response: Response = await fetch(preset.url);
			if (!response.ok) {
				handleError(new Error(`Failed to fetch ${preset.label}: ${response.status}`));
				return;
			}
			const blob: Blob = await response.blob();
			const file: File = new File([blob], `${preset.label.toLowerCase()}.zip`, {
				type: 'application/zip'
			});
			await importFromFile(file);
		} catch (error: unknown) {
			const message: string = error instanceof Error ? error.message : String(error);
			handleError(new Error(message));
		}
	}
</script>

<div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
	{#if errorMessage !== null}
		<AlertRoot variant="destructive" class="m-2">
			<CircleAlert />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription class="flex w-full items-center justify-between gap-3">
				<span>{errorMessage}</span>
				<Button variant="ghost" size="sm" onclick={dismissError}>Dismiss</Button>
			</AlertDescription>
		</AlertRoot>
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

					<div class="flex items-center gap-3">
						<div class="h-px flex-1 bg-border"></div>
						<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							or pick a sample project
						</span>
						<div class="h-px flex-1 bg-border"></div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						{#each PRESETS as preset (preset.url)}
							<button
								type="button"
								onclick={() => loadPreset(preset)}
								class="group flex flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/50"
							>
								<div class="flex w-full items-center justify-between gap-2">
									<span class="text-sm font-medium text-foreground">{preset.label}</span>
									<Badge variant={TIER_VARIANT[preset.tier]}>{preset.tier}</Badge>
								</div>
								<div class="flex w-full items-center justify-between gap-2">
									<span class="text-xs text-muted-foreground">{preset.description}</span>
									<span class="text-xs text-muted-foreground">{preset.sizeLabel}</span>
								</div>
							</button>
						{/each}
					</div>
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
