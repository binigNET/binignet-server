<script lang="ts">
	import { page } from '$app/state';
	import { HLDS_GAMES } from '$lib/games';
	import { under } from '$lib/nav';

	let { data, children } = $props();

	const base = $derived(`/${data.game}`);
	const links = $derived([
		[base, 'Server'],
		[`${base}/bans`, 'Bans']
	] as const);
	const s = $derived(data.server);
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
</nav>
{#if !s.info}
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
