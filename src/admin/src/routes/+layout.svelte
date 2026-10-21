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
	import { canAccess, home } from '$lib/access';
	import { GAME_IDS, HLDS_GAMES } from '$lib/games';
	import { WC3_LINKS, under } from '$lib/nav';

	let { data, children } = $props();

	const path = $derived(page.url.pathname);
	const role = $derived(data.user?.role ?? 'player');
	const wc3 = $derived(WC3_LINKS.filter(([h]) => canAccess(role, h)));
	const tabs = $derived(
		[
			{ href: '/', label: 'Overview', active: path === '/' },
			...(wc3.length ? [{ href: wc3[0][0], label: 'Warcraft 3', active: WC3_LINKS.some(([h]) => under(path, h)) }] : []),
			...GAME_IDS.map((g) => ({ href: `/${g}`, label: HLDS_GAMES[g].label, active: under(path, `/${g}`) }))
		].filter((t) => canAccess(role, t.href))
	);
</script>

<svelte:head><title>binignet admin</title></svelte:head>
<ModeWatcher defaultMode="dark" />
<Toaster richColors position="bottom-right" />
<ConfirmHost />

{#if data.user}
	<header class="flex flex-wrap items-center gap-2 border-b px-4 py-2">
		<a href={home(role)} class="mr-2 shrink-0 font-semibold tracking-tight text-primary">binignet admin</a>
		<nav class="order-last flex w-full min-w-0 gap-1 overflow-x-auto sm:order-none sm:w-auto">
			{#each tabs as t (t.href)}
				<Button href={t.href} size="sm" variant={t.active ? 'secondary' : 'ghost'} aria-current={t.active ? 'page' : undefined}>
					{t.label}
				</Button>
			{/each}
		</nav>
		<div class="ml-auto flex shrink-0 items-center gap-1">
			<span class="max-w-32 truncate text-sm text-muted-foreground" title={data.user.name}>{data.user.name}</span>
			<Button size="icon-sm" variant="ghost" onclick={toggleMode} aria-label="Toggle theme">
				<Sun class="hidden dark:block" />
				<Moon class="dark:hidden" />
			</Button>
			<form method="POST" action="/logout">
				<Button type="submit" size="sm" variant="ghost" aria-label="Log out"><LogOut /> <span class="hidden sm:inline">Log out</span></Button>
			</form>
		</div>
	</header>
{/if}

<main class="mx-auto max-w-5xl p-4">
	{@render children()}
</main>
