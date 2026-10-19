<script lang="ts">
	import { submit } from '$lib/submit';
	import DurationReason from '$lib/DurationReason.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { latest } from '$lib/latest.svelte';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { button, input, small } from '$lib/styles';

	let { data } = $props();
	autoRefresh(10_000);

	const server = latest(() => data.server);
	const maps = latest(() => data.maps);
	const info = $derived(server.value?.info);
	const players = $derived(server.value?.players ?? []);
	const bots = $derived(server.value?.bots ?? 0);
	const error = $derived(
		server.value && !server.value.players
			? `player list needs rcon (${server.value.rcon.error || server.value.error || 'unavailable'})`
			: ''
	);
	// $state, not $derived: autoRefresh reloads data and would reset the pick; set once data arrives
	let map = $state('');
	$effect(() => {
		if (!map) map = info?.map ?? maps.value?.cycle[0] ?? maps.value?.other[0] ?? '';
	});
	let custom = $state('');
	const sk = $derived(data.botCfg.skill);
</script>

{#if !server.value}
	<div class="mb-6 space-y-2"><Skeleton class="h-4 w-64" /><Skeleton class="h-4 w-40" /><Skeleton class="h-4 w-52" /></div>
{:else if info}
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
			use:submit={{ confirm: `Change map to ${custom.trim() || map}?`, reset: false }}
			class="flex flex-wrap items-center gap-2"
		>
			{#if !maps.value}
				<Skeleton class="h-9 w-56" />
			{:else}
				<select name="map" bind:value={map} class="{input} max-w-56">
					{#if maps.value.cycle.length}
						<optgroup label="Map cycle">{#each maps.value.cycle as m}<option value={m}>{m}</option>{/each}</optgroup>
					{/if}
					{#if maps.value.other.length}
						<optgroup label="Other">{#each maps.value.other as m}<option value={m}>{m}</option>{/each}</optgroup>
					{/if}
				</select>
			{/if}
			<input name="custom" bind:value={custom} maxlength="64" placeholder="or type a map" class="{input} w-40" />
			<button class={button}>Change map</button>
		</form>
		<form
			method="POST"
			action="?/restart"
			use:submit={{ confirm: `${data.restartLabel}?` }}
			class="mt-3"
		>
			<button class={small}>{data.restartLabel}</button>
		</form>
	</section>

	<section class="rounded border border-zinc-800 p-4">
		<h2 class="mb-2 font-medium">Bots <span class="text-sm font-normal text-zinc-400">({bots} in game)</span></h2>
		<div class="flex flex-wrap items-center gap-2">
			<form
				method="POST"
				action="?/kickbots"
				use:submit={{ confirm: { title: `Kick all ${bots} bots?`, destructive: true } }}
			>
				<button class="{small} text-red-400" disabled={!bots}>Kick all bots</button>
			</form>
			<form method="POST" action="?/readdbots" use:submit>
				<button class={small}>Re-add bots ({data.botCfg.defaults.bots})</button>
			</form>
			<form method="POST" action="?/addbots" use:submit={{ reset: false }} class="flex gap-1">
				<input name="n" type="number" min="1" max="31" value="1" class="{input} w-16 px-2 py-1 text-xs" />
				<button class={small}>Add</button>
			</form>
		</div>
		<form method="POST" action="?/botskill" use:submit={{ reset: false }} class="mt-3 flex items-center gap-1">
			<input name="skill" type="number" min={sk.min} max={sk.max} value={data.botCfg.defaults.skill} class="{input} w-16 px-2 py-1 text-xs" />
			<button class={small}>Set skill</button>
			<span class="text-xs text-zinc-400">{sk.hint}</span>
		</form>
		<details class="mt-3 text-sm">
			<summary class="cursor-pointer text-zinc-400">Defaults (server start)</summary>
			<form method="POST" action="?/savebots" use:submit={{ reset: false }} class="mt-2 flex flex-wrap items-center gap-2">
				<label class="flex items-center gap-1 text-xs">Bots <input name="bots" type="number" min="0" max="31" value={data.botCfg.defaults.bots} class="{input} w-16 px-2 py-1 text-xs" /></label>
				<label class="flex items-center gap-1 text-xs">Skill <input name="skill" type="number" min={sk.min} max={sk.max} value={data.botCfg.defaults.skill} class="{input} w-16 px-2 py-1 text-xs" /></label>
				<button class={small}>Save as default</button>
			</form>
		</details>
	</section>
</div>

<section class="mb-8 rounded border border-zinc-800 p-4">
	<h2 class="mb-2 font-medium">Say</h2>
	<form method="POST" action="?/say" use:submit class="flex flex-wrap items-center gap-2">
		<input name="msg" required maxlength="190" placeholder="Message to all players" class="{input} min-w-60 flex-1" />
		<select name="mode" class="{input} w-28">
			<option value="chat">Chat</option>
			<option value="center">Centre</option>
			<option value="hud">HUD</option>
		</select>
		<button class={button}>Send</button>
	</form>
</section>

<h2 class="mb-2 font-medium">Players <span class="text-sm font-normal text-zinc-400">({players.length})</span></h2>
{#if !server.value}
	<div class="space-y-2"><Skeleton class="h-8 w-full" /><Skeleton class="h-8 w-full" /></div>
{:else if error}
	<p class="text-sm text-amber-400">{error}</p>
{:else if !players.length}
	<p class="text-sm text-zinc-400">No players online.</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">#</th><th>Name</th><th>ID</th><th>IP</th><th>Frags</th><th>Time</th><th>Ping</th><th></th></tr>
		</thead>
		<tbody>
			{#each players as p (p.userid)}
				<tr class="border-t border-zinc-800">
					<td class="py-2 text-zinc-400">{p.userid}</td>
					<td>{p.name}</td>
					<td class="font-mono text-xs">{p.uniqueid}</td>
					<td class="font-mono text-xs">{p.addr.replace(/:\d+$/, '')}</td>
					<td>{p.frags}</td>
					<td>{p.time}</td>
					<td>{p.ping}</td>
					<td class="text-right">
						<div class="flex justify-end gap-1">
							<form method="POST" action="?/kick" use:submit>
								<input type="hidden" name="userid" value={p.userid} />
								<button class={small}>Kick</button>
							</form>
							<details class="relative">
								<summary class="{small} cursor-pointer list-none text-red-400">Ban</summary>
								<form
									method="POST"
									action="?/ban"
									use:submit={{ confirm: { title: `Ban ${p.name}?`, destructive: true } }}
									class="absolute right-0 z-10 mt-1 flex w-96 flex-wrap gap-2 rounded border border-zinc-700 bg-zinc-950 p-3"
								>
									<input type="hidden" name="userid" value={p.userid} />
									<input type="hidden" name="uniqueid" value={p.uniqueid} />
									<input type="hidden" name="ip" value={p.addr.replace(/:\d+$/, '')} />
									<select name="type" class="{input} w-28">
										<option value="both">ID + IP</option>
										<option value="id">Steam ID</option>
										<option value="ip">IP</option>
									</select>
									<DurationReason />
									<button class="{small} text-red-400">Ban {p.name}</button>
								</form>
							</details>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
