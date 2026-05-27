<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import EditorSession from '$lib/components/EditorSession.svelte';
	import {
		StaticDefaultEditorConfigurationService,
		type IEditorConfigurationService
	} from '$lib/core/editor/configuration/editor-config-models';
	import {
		EMPTY_CONTENT_HASH,
		type FileSystemMapReadonly,
		type FileSystemPath,
		type IFileSystemEngine,
		type NodeID,
		NodeType,
		type OperationError,
		ROOT_NODE_ID,
		ROOT_PERMISSIONS
	} from '$lib/core/file-system/domain/file-system-models';
	import { FileSystemLoader } from '$lib/core/file-system/loader/file-system-loader';
	import type { IFileSystemService } from '$lib/core/file-system/services/file-system-service';
	import { FileSystemService } from '$lib/core/file-system/services/file-system-service-impl';
	import { FileSystemCommandFactory } from '$lib/core/file-system/services/command-factory/file-system-command-factory-impl';
	import { FileSystemZipImporter } from '$lib/core/file-system/persistance/import/file-system-importer-impl';
	import type {
		CreateEditorSessionError,
		IEditorSession
	} from '$lib/core/session/editor-session';
	import { EditorSessionFactory } from '$lib/core/session/editor-session-factory-impl';
	import { EditorUserSpaceStateService } from '$lib/core/state/user-space/editor-user-space-state-impl';
	import type { Result } from '$lib/core/shared/models-utils';
	import { initMonacoWorkers } from '$lib/core/editor/utils/workers/code-editor-workers';

	const SRC_FOLDER_ID: NodeID = 1 as NodeID;
	const SOLUTION_ID: NodeID = 2 as NodeID;
	const NOTES_ID: NodeID = 3 as NodeID;
	const README_ID: NodeID = 4 as NodeID;

	const initialState: FileSystemMapReadonly = {
		[ROOT_NODE_ID]: {
			id: ROOT_NODE_ID,
			type: NodeType.FOLDER,
			name: 'project',
			path: '/project' as FileSystemPath,
			parentID: null,
			permissions: ROOT_PERMISSIONS,
			children: [SRC_FOLDER_ID, README_ID],
			userSpace: null
		},
		[SRC_FOLDER_ID]: {
			id: SRC_FOLDER_ID,
			type: NodeType.FOLDER,
			name: 'src',
			path: '/project/src' as FileSystemPath,
			parentID: ROOT_NODE_ID,
			permissions: ROOT_PERMISSIONS,
			children: [SOLUTION_ID, NOTES_ID],
			userSpace: null
		},
		[SOLUTION_ID]: {
			id: SOLUTION_ID,
			type: NodeType.FILE,
			name: 'solution.py',
			path: '/project/src/solution.py' as FileSystemPath,
			parentID: SRC_FOLDER_ID,
			content:
				'def solve() -> None:\n\tmessage = "multi editor route"\n\tprint(message)\n\n\nif __name__ == "__main__":\n\tsolve()\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		},
		[NOTES_ID]: {
			id: NOTES_ID,
			type: NodeType.FILE,
			name: 'notes.md',
			path: '/project/src/notes.md' as FileSystemPath,
			parentID: SRC_FOLDER_ID,
			content: '# Notes\n\nShared scratch pad across both editors.\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		},
		[README_ID]: {
			id: README_ID,
			type: NodeType.FILE,
			name: 'README.md',
			path: '/project/README.md' as FileSystemPath,
			parentID: ROOT_NODE_ID,
			content:
				'# Multi Editor\n\nTwo independent EditorSession instances writing the same in-memory file system.\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		}
	};

	let sessionA: IEditorSession | null = $state(null);
	let sessionB: IEditorSession | null = $state(null);
	let loadErrorMessage: string | null = $state(null);
	let fileSystemService: IFileSystemService | null = null;

	const codeEditorConfigurationService: IEditorConfigurationService =
		new StaticDefaultEditorConfigurationService();
	const sessionFactory: EditorSessionFactory = new EditorSessionFactory(
		new FileSystemZipImporter()
	);

	onMount(async (): Promise<void> => {
		initMonacoWorkers();

		const loadResult: Result<IFileSystemEngine, OperationError> =
			await FileSystemLoader.load(initialState);
		if (!loadResult.ok) {
			loadErrorMessage = loadResult.error.message;
			return;
		}

		const fileSystemEngine: IFileSystemEngine = loadResult.value;
		const userSpaceStateService: EditorUserSpaceStateService = new EditorUserSpaceStateService();
		const commandFactory: FileSystemCommandFactory = new FileSystemCommandFactory(
			userSpaceStateService
		);
		const sharedFileSystemService: IFileSystemService = new FileSystemService(
			fileSystemEngine,
			commandFactory
		);
		fileSystemService = sharedFileSystemService;

		const resultA: Result<IEditorSession, CreateEditorSessionError> =
			await sessionFactory.createFromFileSystem(
				sharedFileSystemService,
				codeEditorConfigurationService
			);
		if (!resultA.ok) {
			loadErrorMessage = resultA.error.message;
			return;
		}
		sessionA = resultA.value;

		const resultB: Result<IEditorSession, CreateEditorSessionError> =
			await sessionFactory.createFromFileSystem(
				sharedFileSystemService,
				codeEditorConfigurationService
			);
		if (!resultB.ok) {
			loadErrorMessage = resultB.error.message;
			return;
		}
		sessionB = resultB.value;
	});

	onDestroy((): void => {
		if (sessionA !== null) sessionA.dispose();
		if (sessionB !== null) sessionB.dispose();
		if (fileSystemService !== null) fileSystemService.destroy();
	});
</script>

<div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
	{#if loadErrorMessage !== null}
		<div class="flex flex-1 items-center justify-center p-6">
			<div
				class="max-w-xl rounded-lg border border-failure bg-card p-4 text-sm text-failure-foreground"
			>
				{loadErrorMessage}
			</div>
		</div>
	{:else if sessionA !== null && sessionB !== null}
		<div class="flex min-h-0 flex-1 flex-row">
			<div class="min-h-0 min-w-0 flex-1 border-r border-border">
				<EditorSession session={sessionA} />
			</div>
			<div class="min-h-0 min-w-0 flex-1">
				<EditorSession session={sessionB} />
			</div>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
			Loading workspace…
		</div>
	{/if}
</div>
