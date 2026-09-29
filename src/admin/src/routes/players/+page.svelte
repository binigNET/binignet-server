<script lang="ts">
	import { ago } from '$lib/format';
	import { autoRefresh } from '$lib/refresh.svelte';

	let { data } = $props();
	autoRefresh();
</script>

<div class="mb-4 flex items-baseline gap-3">
	<h1 class="text-xl font-semibold">Online players</h1>
	<span class="text-sm text-zinc-400">
		{data.users.length} online{data.accounts !== null ? ` · ${data.accounts} accounts` : ''}
		{#if data.updatedAt}· status {ago(data.updatedAt)}{/if}
	</span>
</div>

{#if !data.updatedAt}
	<p class="text-sm text-red-400">Status file missing — is pvpgn running with XML_status_output?</p>
{:else if !data.users.length}
	<p class="text-sm text-zinc-400">Nobody online.</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">Name</th><th>Client</th><th>Version</th><th>Country</th><th>Game</th></tr>
		</thead>
		<tbody>
			{#each data.users as u (u.name)}
				<tr class="border-t border-zinc-800">
					<td class="py-2">{u.name}</td>
					<td>{u.clienttag}</td>
					<td>{u.version || '—'}</td>
					<td>{u.country}</td>
					<td>{u.game ?? '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
