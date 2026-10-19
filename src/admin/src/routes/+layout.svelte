<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
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

{#if data.authed}
	<header class="flex items-center gap-6 border-b border-zinc-800 px-4 py-3">
		<a href="/" class="font-semibold">binignet admin</a>
		<nav class="flex gap-4 text-sm">
			{#each tabs as t}
				<a href={t.href} class={t.active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}>{t.label}</a>
			{/each}
		</nav>
		<form method="POST" action="/logout" class="ml-auto">
			<button class="text-sm text-zinc-400 hover:text-zinc-100">Log out</button>
		</form>
	</header>
{/if}

<main class="mx-auto max-w-5xl p-4">
	{@render children()}
</main>
