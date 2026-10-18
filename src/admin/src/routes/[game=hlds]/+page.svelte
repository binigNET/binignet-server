<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	autoRefresh(10_000);

	const info = $derived(data.server.info);
	// $state, not $derived: autoRefresh reloads data and would reset the pick
	let map = $state(untrack(() => data.server.info?.map ?? data.maps.cycle[0] ?? data.maps.other[0] ?? ''));
	let custom = $state('');
</script>

{#if info}
	<dl class="mb-6 grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
		<dt class="text-zinc-400">Hostname</dt>
		<dd>{info.name}</dd>
		<dt class="text-zinc-400">Map</dt>
		<dd>{info.map}</dd>
		<dt class="text-zinc-400">Players</dt>
		<dd>{info.players - info.bots} / {info.maxPlayers}{info.bots ? ` (+${info.bots} bots)` : ''}</dd>
	</dl>
{/if}

<div class="mb-8 grid gap-4 md:grid-cols-2">
	<section class="rounded border border-zinc-800 p-4">
		<h2 class="mb-2 font-medium">Map</h2>
		<form
			method="POST"
			action="?/map"
			use:enhance={({ cancel }) => {
				if (!confirm(`Change map to ${custom.trim() || map}?`)) cancel();
				return async ({ update }) => update({ reset: false });
			}}
			class="flex flex-wrap items-center gap-2"
		>
			<select name="map" bind:value={map} class="{input} max-w-56">
				{#if data.maps.cycle.length}
					<optgroup label="Map cycle">{#each data.maps.cycle as m}<option value={m}>{m}</option>{/each}</optgroup>
				{/if}
				{#if data.maps.other.length}
					<optgroup label="Other">{#each data.maps.other as m}<option value={m}>{m}</option>{/each}</optgroup>
				{/if}
			</select>
			<input name="custom" bind:value={custom} maxlength="64" placeholder="or type a map" class="{input} w-40" />
			<button class={button}>Change map</button>
		</form>
		<Flash {form} name="map" />
		<form
			method="POST"
			action="?/restart"
			use:enhance={({ cancel }) => {
				if (!confirm(`${data.restartLabel}?`)) cancel();
			}}
			class="mt-3"
		>
			<button class={small}>{data.restartLabel}</button>
		</form>
		<Flash {form} name="restart" />
	</section>

	<section class="rounded border border-zinc-800 p-4">
		<h2 class="mb-2 font-medium">Bots <span class="text-sm font-normal text-zinc-400">({data.bots} in game)</span></h2>
		<div class="flex flex-wrap items-center gap-2">
			<form
				method="POST"
				action="?/kickbots"
				use:enhance={({ cancel }) => {
					if (!confirm(`Kick all ${data.bots} bots?`)) cancel();
				}}
			>
				<button class="{small} text-red-400" disabled={!data.bots}>Kick all bots</button>
			</form>
			<form method="POST" action="?/readdbots" use:enhance>
				<button class={small}>Re-add bots ({data.defaultBots})</button>
			</form>
			<form method="POST" action="?/addbots" use:enhance={() => async ({ update }) => update({ reset: false })} class="flex gap-1">
				<input name="n" type="number" min="1" max="31" value="1" class="{input} w-16 px-2 py-1 text-xs" />
				<button class={small}>Add</button>
			</form>
		</div>
		<Flash {form} name="bots" />
	</section>
</div>

<h2 class="mb-2 font-medium">Players <span class="text-sm font-normal text-zinc-400">({data.players.length})</span></h2>
{#if data.error}
	<p class="text-sm text-amber-400">{data.error}</p>
{:else if !data.players.length}
	<p class="text-sm text-zinc-400">No players online.</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">#</th><th>Name</th><th>ID</th><th>IP</th><th>Frags</th><th>Time</th><th>Ping</th></tr>
		</thead>
		<tbody>
			{#each data.players as p (p.userid)}
				<tr class="border-t border-zinc-800">
					<td class="py-2 text-zinc-400">{p.userid}</td>
					<td>{p.name}</td>
					<td class="font-mono text-xs">{p.uniqueid}</td>
					<td class="font-mono text-xs">{p.addr.replace(/:\d+$/, '')}</td>
					<td>{p.frags}</td>
					<td>{p.time}</td>
					<td>{p.ping}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
