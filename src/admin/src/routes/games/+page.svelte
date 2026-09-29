<script lang="ts">
	import { ago } from '$lib/format';
	import { autoRefresh } from '$lib/refresh.svelte';

	let { data } = $props();
	autoRefresh();
</script>

<div class="mb-4 flex items-baseline gap-3">
	<h1 class="text-xl font-semibold">Games</h1>
	<span class="text-sm text-zinc-400">
		{data.games.length} active{#if data.updatedAt} · status {ago(data.updatedAt)}{/if}
	</span>
</div>
{#if data.auraError}
	<p class="mb-3 text-sm text-amber-400">aura unavailable ({data.auraError}) — showing pvpgn listing only</p>
{/if}

{#if !data.games.length}
	<p class="text-sm text-zinc-400">No games.</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">Name</th><th>Map</th><th>State</th><th>Owner</th><th>Slots</th><th>Time</th><th>Players (pvpgn)</th></tr>
		</thead>
		<tbody>
			{#each data.games as { aura, pvpgn }, i (i)}
				<tr class="border-t border-zinc-800 align-top">
					<td class="py-2">{aura?.name ?? pvpgn?.name}</td>
					<td>{aura?.map ?? '—'}</td>
					<td>
						{#if aura}
							<span class={aura.lobby ? 'text-emerald-400' : 'text-sky-400'}>{aura.lobby ? 'lobby' : 'playing'}</span>
						{:else}
							<span class="text-zinc-400">user-hosted</span>
						{/if}
					</td>
					<td>{aura?.owner ?? '—'}</td>
					<td>{aura ? `${aura.players}/${aura.slots}` : '—'}</td>
					<td>{aura ? `${aura.minutes}m` : '—'}</td>
					<td>{pvpgn?.players.join(', ') || '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
