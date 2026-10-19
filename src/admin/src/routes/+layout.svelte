<script lang="ts">
	import '../app.css';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { page } from '$app/state';
	import ConfirmHost from '$lib/ConfirmHost.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Toaster } from '$lib/components/ui/sonner';
	import { GAME_IDS, HLDS_GAMES } from '$lib/games';
	import { WC3_LINKS, under } from '$lib/nav';

	let { data, children } = $props();

	const path = $derived(page.url.pathname);
	const tabs = $derived([
		{ href: '/', label: 'Overview', active: path === '/' },
		{ href: WC3_LINKS[0][0], label: 'Warcraft 3', active: WC3_LINKS.some(([h]) => under(path, h)) },
		...GAME_IDS.map((g) => ({ href: `/${g}`, label: HLDS_GAMES[g].label, active: under(path, `/${g}`) }))
	]);
</script>

<svelte:head><title>binignet admin</title></svelte:head>
<ModeWatcher defaultMode="dark" />
<Toaster richColors position="bottom-right" />
<ConfirmHost />

{#if data.authed}
	<header class="flex items-center gap-2 border-b px-4 py-2">
		<a href="/" class="mr-2 shrink-0 font-semibold tracking-tight text-primary">binignet admin</a>
		<nav class="flex min-w-0 gap-1 overflow-x-auto">
			{#each tabs as t (t.href)}
				<Button href={t.href} size="sm" variant={t.active ? 'secondary' : 'ghost'} aria-current={t.active ? 'page' : undefined}>
					{t.label}
				</Button>
			{/each}
		</nav>
		<div class="ml-auto flex shrink-0 items-center gap-1">
			<Button size="icon-sm" variant="ghost" onclick={toggleMode} aria-label="Toggle theme">
				<Sun class="hidden dark:block" />
				<Moon class="dark:hidden" />
			</Button>
			<form method="POST" action="/logout">
				<Button type="submit" size="sm" variant="ghost"><LogOut /> Log out</Button>
			</form>
		</div>
	</header>
{/if}

<main class="mx-auto max-w-5xl p-4">
	{@render children()}
</main>
