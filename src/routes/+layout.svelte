<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import { Moon, Settings, Sun } from '@lucide/svelte';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	import { Button } from '$lib/ui-primitives/button';
	import { cn } from '$lib/utils/cn';

	import EditorSettingsModal from '../playground/EditorSettingsModal.svelte';
	import { onOpenEditorSettings } from '../playground/editor-settings-modal-controller';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
		{ href: '/', label: 'Editor' },
		{ href: '/import-export', label: 'Import / Export' },
		{ href: '/multi-editor', label: 'Multi-editor' }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<ModeWatcher />
<EditorSettingsModal />

<div class="flex h-screen w-screen flex-col overflow-hidden">
	<header
		class="flex h-12 shrink-0 items-center gap-6 border-b border-border bg-background px-4"
	>
		<span class="text-sm font-semibold text-foreground">@anacode/code-editor</span>
		<nav class="flex items-center gap-1">
			{#each NAV_ITEMS as item (item.href)}
				<a
					href={item.href}
					class={cn(
						'rounded-md px-3 py-1.5 text-sm transition-colors',
						isActive(item.href)
							? 'bg-accent text-foreground'
							: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
					)}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				aria-label="Editor settings"
				onclick={onOpenEditorSettings}
			>
				<Settings class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Toggle theme"
				onclick={toggleMode}
			>
				<Sun class="size-4 dark:hidden" />
				<Moon class="hidden size-4 dark:block" />
			</Button>
		</div>
	</header>

	<main class="min-h-0 flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
