<script lang="ts">
	let { data } = $props();
	const h = $derived(data.health!);

	const rows = $derived([
		['pvpgn telnet', h.telnet.state === 'ready', h.telnet.state + (h.telnet.error ? ` — ${h.telnet.error}` : '')],
		['pvpgn database', h.db, h.db ? 'connected' : 'unreachable'],
		['status file', h.statusAgeS !== null && h.statusAgeS < 60, h.statusAgeS === null ? 'missing' : `updated ${h.statusAgeS}s ago`],
		['aura database', h.auraDb, h.auraDb ? 'found' : 'missing']
	] as const);
</script>

<h1 class="mb-4 text-xl font-semibold">Overview</h1>
<table class="w-full text-sm">
	<tbody>
		{#each rows as [name, ok, detail]}
			<tr class="border-b border-zinc-800">
				<td class="py-2">{name}</td>
				<td class="py-2"><span class={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? 'ok' : 'down'}</span></td>
				<td class="py-2 text-zinc-400">{detail}</td>
			</tr>
		{/each}
	</tbody>
</table>
