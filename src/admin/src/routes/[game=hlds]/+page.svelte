<script lang="ts">
	import { autoRefresh } from '$lib/refresh.svelte';

	let { data } = $props();
	autoRefresh(10_000);

	const info = $derived(data.server.info);
</script>

{#if info}
	<dl class="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
		<dt class="text-zinc-400">Hostname</dt>
		<dd>{info.name}</dd>
		<dt class="text-zinc-400">Map</dt>
		<dd>{info.map}</dd>
		<dt class="text-zinc-400">Players</dt>
		<dd>{info.players - info.bots} / {info.maxPlayers}{info.bots ? ` (+${info.bots} bots)` : ''}</dd>
	</dl>
{/if}
