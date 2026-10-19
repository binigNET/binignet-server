<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	// Underlined link tabs (sub-navigation); scrolls sideways on narrow screens.
	let { links, label, end }: { links: { href: string; label: string; active: boolean }[]; label?: string; end?: Snippet } = $props();
</script>

<nav class="mb-4 flex items-center gap-1 overflow-x-auto border-b text-sm">
	{#if label}<span class="mr-2 shrink-0 font-semibold">{label}</span>{/if}
	{#each links as l (l.href)}
		<a
			href={l.href}
			aria-current={l.active ? 'page' : undefined}
			class={cn(
				'-mb-px shrink-0 border-b-2 px-2 py-2 whitespace-nowrap transition-colors',
				l.active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
			)}>{l.label}</a
		>
	{/each}
	{#if end}<div class="ml-auto shrink-0 pl-2">{@render end()}</div>{/if}
</nav>
