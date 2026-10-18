<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	let hosting = $state<string | null>(null);
	const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + ' MB';
	// WC3 1.26 player colors by index
	const COLORS = ['Red', 'Blue', 'Teal', 'Purple', 'Yellow', 'Orange', 'Green', 'Pink', 'Gray', 'Light Blue', 'Dark Green', 'Brown'];
</script>

<h1 class="mb-4 text-xl font-semibold">Saves <span class="text-sm font-normal text-zinc-400">{data.saves.length} in aura/data/saves</span></h1>

<section class="mb-6">
	<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance class="flex flex-wrap items-center gap-2">
		<input type="file" name="file" accept=".w3z" required class="text-sm" />
		<button class={button}>Upload</button>
		<span class="text-xs text-zinc-400">.w3z from a player's Warcraft III\save\Multiplayer, max {mb(data.maxBytes)}. Keep the original file name.</span>
	</form>
	<Flash {form} name="upload" />
	<Flash {form} name="host" />
</section>

<datalist id="accounts">{#each data.accounts as a}<option value={a}></option>{/each}</datalist>

<div class="space-y-4">
	{#each data.saves as s (s.name)}
		<section class="max-w-3xl rounded border border-zinc-800 p-4">
			<div class="mb-2 flex flex-wrap items-baseline gap-3">
				<h2 class="font-medium">{s.name}</h2>
				<span class="text-xs text-zinc-400">{mb(s.size)} · {new Date(s.mtime).toLocaleDateString()}</span>
				<form method="POST" action="?/delete" class="ml-auto" use:enhance={({ cancel }) => { if (!confirm(`Delete ${s.name}?`)) cancel(); }}>
					<input type="hidden" name="name" value={s.name} /><button class="{small} text-red-400">Delete</button>
				</form>
			</div>
			{#if !s.info}
				<p class="text-sm text-red-400">Unreadable save: {s.error}</p>
			{:else}
				<p class="mb-3 text-sm text-zinc-400">
					Map {s.info.mapFile}
					{#if !s.map}— <span class="text-amber-400">not uploaded</span>, add it on the <a href="/maps" class="underline">Maps</a> page first{/if}
				</p>
				<form
					method="POST"
					action="?/host"
					use:enhance={() => { hosting = s.name; return async ({ update }) => { await update({ reset: false }); hosting = null; }; }}
					class="space-y-2"
				>
					<input type="hidden" name="save" value={s.name} />
					<input name="name" maxlength="30" value={s.info.gameName.slice(0, 30)} placeholder="Game name" class="{input} w-64" />
					<table class="text-sm">
						<thead class="text-zinc-400"><tr><th class="pr-4 text-left">Slot</th><th class="pr-4 text-left">Team</th><th class="pr-4 text-left">Race</th><th class="text-left">Player</th></tr></thead>
						<tbody>
							{#each s.info.slots.filter((x) => x.human) as slot}
								<tr>
									<td class="pr-4">{COLORS[slot.color] ?? `#${slot.color + 1}`}</td>
									<td class="pr-4">{slot.team + 1}</td>
									<td class="pr-4">{slot.race}</td>
									<td class="py-1"><input name="player" list="accounts" required maxlength="15" class="{input} w-48 py-1" /></td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button class={button} disabled={!s.map || hosting !== null}>{hosting === s.name ? 'Hosting… (loading map)' : 'Load'}</button>
					<p class="text-xs text-zinc-400">Players must still have this save in their own Save\Multiplayer folder. Lobby auto-starts once all join; the save is deleted here after hosting.</p>
				</form>
			{/if}
			<Flash {form} name="row:{s.name}" />
		</section>
	{:else}
		<p class="text-sm text-zinc-400">No saves uploaded.</p>
	{/each}
</div>
