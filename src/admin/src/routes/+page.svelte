<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { GAME_IDS, HLDS_GAMES } from '$lib/games';
	import { latest } from '$lib/latest.svelte';

	let { data } = $props();
	const h = $derived(data.health!);
	const servers = latest(() => data.servers);

	const rows = $derived([
		['pvpgn telnet', h.telnet.state === 'ready', h.telnet.state + (h.telnet.error ? ` — ${h.telnet.error}` : '')],
		['pvpgn database', h.db, h.db ? 'connected' : 'unreachable'],
		['status file', h.statusAgeS !== null && h.statusAgeS < 60, h.statusAgeS === null ? 'missing' : `updated ${h.statusAgeS}s ago`],
		['aura database', h.auraDb, h.auraDb ? 'found' : 'missing'],
		...(servers.value ?? []).map(
			(s) =>
				[
					`${HLDS_GAMES[s.game].label} server`,
					!!s.info,
					s.info
						? `${s.info.map}, ${s.info.players - s.info.bots}/${s.info.maxPlayers} players (via ${s.source === 'rcon' ? 'rcon' : 'query'})`
						: s.error
				] as const
		)
	]);
</script>

<h1 class="mb-4 text-xl font-semibold">Overview</h1>
<table class="w-full text-sm">
	<tbody>
		{#each rows as [name, ok, detail]}
			<tr class="border-b border-zinc-800">
				<td class="py-2">{name}</td>
				<td class="py-2"><span class={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? 'ok' : 'down'}</span></td>
				<td class="py-2 text-zinc-400">{detail}</td>
			</tr>
		{/each}
		{#if !servers.value}
			{#each GAME_IDS as g (g)}
				<tr class="border-b border-zinc-800">
					<td class="py-2"><Skeleton class="h-4 w-32" /></td>
					<td class="py-2"><Skeleton class="h-4 w-10" /></td>
					<td class="py-2"><Skeleton class="h-4 w-48" /></td>
				</tr>
			{/each}
		{/if}
	</tbody>
</table>
