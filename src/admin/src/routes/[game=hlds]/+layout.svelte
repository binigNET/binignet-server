<script lang="ts">
	import { page } from '$app/state';
	import { HLDS_GAMES } from '$lib/games';
	import { Spinner } from '$lib/components/ui/spinner';
	import { latest } from '$lib/latest.svelte';
	import { under } from '$lib/nav';

	let { data, children } = $props();

	const base = $derived(`/${data.game}`);
	const links = $derived([
		[base, 'Server'],
		[`${base}/bans`, 'Bans'],
		[`${base}/settings`, 'Settings'],
		[`${base}/console`, 'Console'],
		[`${base}/logs`, 'Logs']
	] as const);
	const server = latest(() => data.server);
	const s = $derived(server.value);
</script>

<nav class="mb-4 flex gap-4 border-b border-zinc-800 pb-2 text-sm">
	<span class="font-medium">{HLDS_GAMES[data.game].name}</span>
	{#each links as [href, label]}
		<a
			{href}
			class={(href === base ? page.url.pathname === base : under(page.url.pathname, href))
				? 'text-zinc-100'
				: 'text-zinc-400 hover:text-zinc-100'}>{label}</a
		>
	{/each}
	{#if server.pending && s}
		<span class="ml-auto flex items-center gap-1 text-xs text-zinc-400"><Spinner class="size-3" /> updating…</span>
	{/if}
</nav>
{#if !s}
	<!-- status still loading: banners appear once it resolves -->
{:else if !s.info}
	<div class="mb-4 rounded bg-red-900/60 px-4 py-2 text-sm text-red-100">server offline ({s.error})</div>
{:else if s.rcon.state !== 'ok'}
	<div class="mb-4 rounded bg-amber-900/60 px-4 py-2 text-sm text-amber-100">
		{#if s.rcon.state === 'nopass'}
			rcon password not set — actions disabled
		{:else}
			rcon {s.rcon.state} ({s.rcon.error}) — actions may fail
		{/if}
	</div>
{/if}

{@render children()}
