<script lang="ts">
	import { until } from '$lib/format';

	let { data } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Bans</h1>

<section class="mb-8">
	<h2 class="mb-2 font-medium">IP bans</h2>
	{#if data.ips === null}
		<p class="text-sm text-red-400">Can't read bnban.conf.</p>
	{:else if !data.ips.length}
		<p class="text-sm text-zinc-400">None.</p>
	{:else}
		<table class="w-full text-left text-sm">
			<thead class="text-zinc-400"><tr><th class="py-2">IP / range</th><th>Until</th></tr></thead>
			<tbody>
				{#each data.ips as b (b.ip)}
					<tr class="border-t border-zinc-800"><td class="py-2 font-mono">{b.ip}</td><td>{until(b.until)}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

{#each [['Locked accounts', data.locked], ['Muted accounts', data.muted]] as const as [title, rows]}
	<section class="mb-8">
		<h2 class="mb-2 font-medium">{title}</h2>
		{#if rows === null}
			<p class="text-sm text-red-400">Database unreachable.</p>
		{:else if !rows.length}
			<p class="text-sm text-zinc-400">None.</p>
		{:else}
			<table class="w-full text-left text-sm">
				<thead class="text-zinc-400"><tr><th class="py-2">Account</th><th>Until</th><th>Reason</th></tr></thead>
				<tbody>
					{#each rows as b (b.username)}
						<tr class="border-t border-zinc-800">
							<td class="py-2">{b.username}</td><td>{until(b.until)}</td><td>{b.reason || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/each}
