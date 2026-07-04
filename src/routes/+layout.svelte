<script lang="ts">
	import '../app.css';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Check, Languages, Moon, Settings, Sun } from '@lucide/svelte';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	import { EditorLocale } from '$lib';
	import { Button, buttonVariants } from '$lib/ui-primitives/button';
	import {
		Content as DropdownMenuContent,
		Item as DropdownMenuItem,
		Root as DropdownMenuRoot,
		Trigger as DropdownMenuTrigger
	} from '$lib/ui-primitives/dropdown-menu/index';
	import { cn } from '$lib/utils/cn';

	import { getDemoLocale, setDemoLocale } from '$playground/demo-locale';
	import EditorSettingsModal from '$playground/EditorSettingsModal.svelte';
	import { onOpenEditorSettings } from '$playground/editor-settings-modal-controller';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	interface LocaleOption {
		readonly value: EditorLocale;
		readonly label: string;
	}

	const LOCALE_OPTIONS: readonly LocaleOption[] = [
		{ value: EditorLocale.EN, label: 'English' },
		{ value: EditorLocale.FR, label: 'Français' },
		{ value: EditorLocale.ES, label: 'Español' }
	];

	// Read once: setDemoLocale() reloads the page, so the active locale never
	// changes within a single page lifetime.
	const currentLocale: EditorLocale = getDemoLocale();

	const NAV_ITEMS = [
		{ href: '/', label: 'Editor' },
		{ href: '/import-export', label: 'Import / Export' },
		{ href: '/multi-editor', label: 'Multi-editor' }
	] as const;

	function isActive(href: (typeof NAV_ITEMS)[number]['href']): boolean {
		const target: string = resolve(href);
		if (href === '/') {
			return page.url.pathname === target || page.url.pathname === target.replace(/\/$/, '');
		}
		return page.url.pathname === target || page.url.pathname.startsWith(target + '/');
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
					href={resolve(item.href)}
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
			<DropdownMenuRoot>
				<DropdownMenuTrigger
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					aria-label="Language"
				>
					<Languages class="size-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" class="min-w-40">
					{#each LOCALE_OPTIONS as option (option.value)}
						<DropdownMenuItem
							class={cn('justify-between gap-2', option.value === currentLocale && 'text-accent-foreground')}
							onclick={() => setDemoLocale(option.value)}
						>
							<span>{option.label}</span>
							{#if option.value === currentLocale}
								<Check class="size-4" />
							{/if}
						</DropdownMenuItem>
					{/each}
				</DropdownMenuContent>
			</DropdownMenuRoot>
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
