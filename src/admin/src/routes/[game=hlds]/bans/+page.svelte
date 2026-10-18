<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { small } from '$lib/styles';

	let { data, form } = $props();

	const lists = $derived([
		['Steam IDs', data.ids],
		['IPs', data.ips]
	] as const);
</script>

<h1 class="mb-4 text-xl font-semibold">Bans</h1>
<Flash {form} name="unban" />
{#if data.error}
	<p class="text-sm text-amber-400">{data.error}</p>
{:else}
	{#each lists as [title, list]}
		<h2 class="mt-4 mb-2 font-medium">{title} <span class="text-sm font-normal text-zinc-400">({list.length})</span></h2>
		{#if !list.length}
			<p class="text-sm text-zinc-400">None.</p>
		{:else}
			<table class="w-full max-w-xl text-left text-sm">
				<tbody>
					{#each list as b (b.id)}
						<tr class="border-t border-zinc-800">
							<td class="py-2 font-mono text-xs">{b.id}</td>
							<td class="text-zinc-400">{b.expires}</td>
							<td class="text-right">
								<form method="POST" action="?/unban" use:enhance>
									<input type="hidden" name="id" value={b.id} />
									<button class={small}>Unban</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/each}
{/if}
