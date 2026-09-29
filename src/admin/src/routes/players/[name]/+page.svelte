<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { button, input } from '$lib/styles';

	let { data, form } = $props();
	let saving = $state(false);
	const p = $derived(data.player);
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

	<h2 class="mb-2 font-medium">Icon</h2>
	<select name="icon" class="{input} mb-1">
		<option value="" selected={!p.icon}>(default)</option>
		{#each data.icons as i}
			<option value={i.code} selected={p.icon === i.code}>{i.name} ({i.code})</option>
		{/each}
	</select>
	<p class="mb-6 text-xs text-zinc-400">Sets Record\W3XP\userselected_icon. In-client effect still to be confirmed.</p>

	<button class={button} disabled={saving}>{saving ? 'Saving… (pvpgn rate limit, ~1s per change)' : 'Save changes'}</button>
	<Flash {form} name="player" />
</form>
