<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import {
		EditorSession,
		EditorSessionFactory,
		EMPTY_CONTENT_HASH,
		NodeType,
		ROOT_NODE_ID,
		ROOT_PERMISSIONS,
		type CreateEditorSessionError,
		type FileSystemMapReadonly,
		type FileSystemPath,
		type IEditorSession,
		type NodeID,
		type Result
	} from '$lib';
	import type { IEditorConfigurationService } from '$lib/config';
	import { FileSystemZipImporter } from '$lib/persistence';

	import { EditorConfigurationService } from '$playground/editor-config.svelte';

	const SRC_FOLDER_ID: NodeID = 1 as NodeID;
	const SOLUTION_ID: NodeID = 2 as NodeID;
	const NOTES_ID: NodeID = 3 as NodeID;
	const README_ID: NodeID = 4 as NodeID;
	const UNKNOWN_ID: NodeID = 5 as NodeID;
	const NOEXT_ID: NodeID = 6 as NodeID;

	const initialState: FileSystemMapReadonly = {
		[ROOT_NODE_ID]: {
			id: ROOT_NODE_ID,
			type: NodeType.FOLDER,
			name: 'project',
			path: '/project' as FileSystemPath,
			parentID: null,
			permissions: ROOT_PERMISSIONS,
			children: [SRC_FOLDER_ID, README_ID, UNKNOWN_ID, NOEXT_ID],
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
				'def solve() -> None:\n\tmessage = "test editor route"\n\tprint(message)\n\n\nif __name__ == "__main__":\n\tsolve()\n',
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
			content: '# Notes\n\nScratch pad for the test editor route.\n',
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
			content: '# Test Editor\n\nIn-memory workspace for local UI iteration.\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		},
		[UNKNOWN_ID]: {
			id: UNKNOWN_ID,
			type: NodeType.FILE,
			name: 'mystery.xyz',
			path: '/project/mystery.xyz' as FileSystemPath,
			parentID: ROOT_NODE_ID,
			content: 'unknown extension — should render the default-file icon\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		},
		[NOEXT_ID]: {
			id: NOEXT_ID,
			type: NodeType.FILE,
			name: 'NOTICE',
			path: '/project/NOTICE' as FileSystemPath,
			parentID: ROOT_NODE_ID,
			content: 'no extension — should also render the default-file icon\n',
			contentHash: EMPTY_CONTENT_HASH,
			permissions: { read: true, write: true, rename: true, delete: true },
			userSpace: null
		}
	};

	let session: IEditorSession | null = $state(null);
	let loadErrorMessage: string | null = $state(null);

	const codeEditorConfigurationService: IEditorConfigurationService =
		EditorConfigurationService.getInstance();

	const sessionFactory: EditorSessionFactory = new EditorSessionFactory(
		new FileSystemZipImporter()
	);

	onMount(async (): Promise<void> => {
		const result: Result<IEditorSession, CreateEditorSessionError> =
			await sessionFactory.createFromFileSystemMap(
				initialState,
				codeEditorConfigurationService
			);

		if (!result.ok) {
			loadErrorMessage = result.error.message;
			return;
		}

		session = result.value;
	});

	onDestroy((): void => {
		if (session !== null) {
			session.dispose();
		}
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
	{:else if session !== null}
		<div class="min-h-0 flex-1">
			<EditorSession {session} />
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
			Loading workspace…
		</div>
	{/if}
</div>
