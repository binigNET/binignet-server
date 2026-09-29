<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	let editing = $state<string | null>(null);
	const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + ' MB';
</script>

<h1 class="mb-4 text-xl font-semibold">Maps <span class="text-sm font-normal text-zinc-400">{data.maps.length} in aura/data/maps</span></h1>

<section class="mb-6">
	<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance class="flex flex-wrap items-center gap-2">
		<input type="file" name="file" accept=".w3x,.w3m" required class="text-sm" />
		<button class={button}>Upload</button>
		<span class="text-xs text-zinc-400">.w3x / .w3m, max {mb(data.maxBytes)}</span>
	</form>
	<Flash {form} name="upload" />
</section>

<table class="w-full text-left text-sm">
	<thead class="text-zinc-400"><tr><th class="py-2">File</th><th>Size</th><th>Added</th><th></th></tr></thead>
	<tbody>
		{#each data.maps as m (m.name)}
			<tr class="border-t border-zinc-800 align-top">
				<td class="py-2">
					{#if editing === m.name}
						<form method="POST" action="?/rename" use:enhance={() => ({ update, result }) => { if (result.type === 'success') editing = null; update(); }} class="flex gap-2">
							<input type="hidden" name="from" value={m.name} />
							<input name="to" value={m.name} required class="{input} flex-1 py-1" />
							<button class={small}>Save</button>
							<button type="button" class={small} onclick={() => (editing = null)}>Cancel</button>
						</form>
					{:else}
						{m.name}
					{/if}
					<Flash {form} name="row:{m.name}" />
				</td>
				<td class="py-2 whitespace-nowrap">{mb(m.size)}</td>
				<td class="py-2 whitespace-nowrap">{new Date(m.mtime).toLocaleDateString()}</td>
				<td class="py-2 text-right whitespace-nowrap">
					{#if editing !== m.name}
						<button class={small} onclick={() => (editing = m.name)}>Rename</button>
						<form method="POST" action="?/delete" class="inline" use:enhance={({ cancel }) => { if (!confirm(`Delete ${m.name}?`)) cancel(); }}>
							<input type="hidden" name="name" value={m.name} /><button class="{small} text-red-400">Delete</button>
						</form>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
