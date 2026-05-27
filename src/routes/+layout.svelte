<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/cn';

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
	</header>

	<main class="min-h-0 flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
