<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { findIcon, iconSrc, RACES } from '$lib/icons';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	let saving = $state(false);
	const p = $derived(data.player);
	// writable deriveds: reset to saved values after each load
	let icon = $derived(p.icon);
	let tab = $derived(RACES.find((r) => r.icons.some((i) => i.code === p.icon))?.key ?? 'H');
	const current = $derived(findIcon(icon));
</script>

<a href="/players" class="text-sm text-zinc-400 hover:text-zinc-100">← Players</a>
<h1 class="mt-2 mb-4 text-xl font-semibold">{p.username} <span class="text-sm font-normal text-zinc-400">uid {p.uid}</span></h1>

<form method="POST" use:enhance={() => { saving = true; return async ({ update }) => { await update({ reset: false }); saving = false; }; }}>
	<h2 class="mb-2 font-medium">WC3 TFT ladder</h2>
	<table class="mb-6 text-sm">
		<thead class="text-zinc-400">
			<tr><th class="pr-4 text-left"></th>{#each data.fields as f}<th class="px-1 text-left capitalize">{f}</th>{/each}</tr>
		</thead>
		<tbody>
			{#each data.ladders as l}
				<tr>
					<td class="pr-4 py-1 capitalize">{l}</td>
					{#each data.fields as f}
						<td class="px-1 py-1">
							<input type="number" min="0" name="{l}_{f}" value={p.stats[`${l}_${f}`]} class="{input} w-24 py-1" />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<p class="-mt-4 mb-6 text-xs text-zinc-400">Arranged team (AT) stats are per team and not editable here.</p>

	<h2 class="mb-2 flex items-center gap-2 font-medium">
		Icon
		{#if current}
			<img src={iconSrc(current.code)} alt="" class="h-6 rounded-sm" />
			<span class="text-sm font-normal text-zinc-400">{current.name} ({current.code})</span>
		{:else}
			<span class="text-sm font-normal text-zinc-400">{icon ? `${icon} (custom)` : 'Auto (rank by level)'}</span>
		{/if}
	</h2>
	<input type="hidden" name="icon" value={icon} />
	<div class="mb-2 flex flex-wrap gap-1">
		<button type="button" class="{small} {icon === '' ? 'border-zinc-300 bg-zinc-800' : ''}" onclick={() => (icon = '')}>Auto (rank by level)</button>
		<span class="mx-1 border-l border-zinc-700"></span>
		{#each RACES as r}
			<button type="button" class="{small} {tab === r.key ? 'border-zinc-300 bg-zinc-800' : ''}" onclick={() => (tab = r.key)}>{r.label}</button>
		{/each}
	</div>
	<div class="mb-1 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-6">
		{#each RACES.find((r) => r.key === tab)?.icons ?? [] as i}
			<button
				type="button"
				aria-pressed={icon === i.code}
				onclick={() => (icon = i.code)}
				class="flex flex-col items-center gap-1 rounded border p-2 text-xs {icon === i.code ? 'border-amber-400 bg-zinc-800' : 'border-zinc-700 hover:bg-zinc-800'}"
			>
				<img src={iconSrc(i.code)} alt="" class="h-[42px] w-16 rounded-sm" />
				<span class="text-center leading-tight">{i.name}</span>
				<span class="text-zinc-500">{i.code}</span>
			</button>
		{/each}
	</div>
	<p class="mb-6 text-xs text-zinc-400">Sets Record\W3XP\userselected_icon; overrides rank icon. Player must rejoin channel / relog to see change.</p>

	<button class={button} disabled={saving}>{saving ? 'Saving… (pvpgn rate limit, ~1s per change)' : 'Save changes'}</button>
	<Flash {form} name="player" />
</form>
