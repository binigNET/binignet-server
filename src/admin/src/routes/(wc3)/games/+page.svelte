<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { ago } from '$lib/format';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	autoRefresh();
	let hosting = $state(false);
	// $state, not $derived: autoRefresh reloads data and would reset the pick
	let map = $state(untrack(() => data.prefillMap || data.hostable.configs[0] || data.hostable.maps[0] || ''));
	const lobbyOpen = $derived(data.games.some((g) => g.aura?.lobby));
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

<section class="mb-8 max-w-3xl rounded border border-zinc-800 p-4">
	<h2 class="mb-2 font-medium">Host game</h2>
	{#if !data.hostable.configs.length && !data.hostable.maps.length}
		<p class="text-sm text-zinc-400">No maps. Upload one on the <a href="/maps" class="underline">Maps</a> page.</p>
	{:else}
		<form
			method="POST"
			action="?/host"
			use:enhance={() => { hosting = true; return async ({ update }) => { await update({ reset: false }); hosting = false; }; }}
			class="flex flex-wrap items-center gap-2"
		>
			<select name="map" bind:value={map} class="{input} max-w-72">
				{#if data.hostable.configs.length}
					<optgroup label="Configs">{#each data.hostable.configs as c}<option value={c}>{c}</option>{/each}</optgroup>
				{/if}
				{#if data.hostable.maps.length}
					<optgroup label="Maps">{#each data.hostable.maps as m}<option value={m}>{m}</option>{/each}</optgroup>
				{/if}
			</select>
			<input name="name" maxlength="30" placeholder={map.replace(/\.w3[xm]$/i, '').slice(0, 30) || 'Game name'} class="{input} w-56" />
			<select name="visibility" class="{input} w-28">
				<option value="public">Public</option>
				<option value="private">Private</option>
			</select>
			<button class={button} disabled={hosting || lobbyOpen}>{hosting ? 'Hosting… (loading map)' : 'Host'}</button>
		</form>
		<p class="mt-2 text-xs text-zinc-400">
			{#if lobbyOpen}A lobby is already open — aura hosts one at a time.{:else}Lobby closes ~10 min after hosting unless a player in it takes owner (<code>!owner</code> or "Make owner" below).{/if}
		</p>
	{/if}
	<Flash {form} name="host" />
</section>

<Flash {form} name="unhost" />
<Flash {form} name="owner" />

{#if !data.games.length}
	<p class="text-sm text-zinc-400">No games.</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">Name</th><th>Map</th><th>State</th><th>Owner</th><th>Slots</th><th>Time</th><th>Players (pvpgn)</th><th></th></tr>
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
					<td>
						{#if aura?.lobby}
							<div class="flex flex-wrap items-center gap-1">
								{#each pvpgn?.players ?? [] as pl}
									<form method="POST" action="?/owner" use:enhance>
										<input type="hidden" name="user" value={pl} />
										<button class={small} title="Make {pl} the lobby owner">{pl} → owner</button>
									</form>
								{/each}
								<form method="POST" action="?/owner" use:enhance class="flex gap-1">
									<input name="user" required maxlength="15" placeholder="player in lobby" class="{input} w-32 px-2 py-1 text-xs" />
									<button class={small}>Make owner</button>
								</form>
							</div>
						{:else}
							{pvpgn?.players.join(', ') || '—'}
						{/if}
					</td>
					<td class="text-right">
						{#if aura?.lobby}
							{@const lobby = aura}
							<form method="POST" action="?/unhost" use:enhance={({ cancel }) => {
								if (!confirm(`Unhost lobby "${lobby.name}" (${lobby.players}/${lobby.slots})?`)) cancel();
							}}>
								<input type="hidden" name="id" value={lobby.id} />
								<button class="{small} text-red-400">Unhost</button>
							</form>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
