<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { input, small } from '$lib/styles';

	let { data, form } = $props();
</script>

<h1 class="mb-1 text-xl font-semibold">Settings</h1>
<p class="mb-4 text-sm text-zinc-400">
	Apply changes the running server until the next restart or map change. Save as default also writes the server config.
</p>
<Flash {form} name="cvar" />
{#if data.error}
	<p class="mb-3 text-sm text-amber-400">{data.error}</p>
{/if}
<table class="w-full max-w-3xl text-left text-sm">
	<thead class="text-zinc-400">
		<tr><th class="py-2">Setting</th><th>Live</th><th>Saved</th><th></th></tr>
	</thead>
	<tbody>
		{#each data.cvars as c (c.name)}
			<tr class="border-t border-zinc-800">
				<td class="py-2">{c.label} <span class="font-mono text-xs text-zinc-500">{c.name}</span></td>
				<td class="font-mono text-xs">{c.live ?? '—'}</td>
				<td class="font-mono text-xs text-zinc-400">{c.saved ?? '—'}</td>
				<td>
					<form method="POST" use:enhance={() => async ({ update }) => update({ reset: false })} class="flex justify-end gap-1">
						<input type="hidden" name="name" value={c.name} />
						{#if c.type === 'bool'}
							<select name="value" class="{input} w-20 px-2 py-1 text-xs">
								<option value="1" selected={c.live === '1'}>on</option>
								<option value="0" selected={c.live !== '1'}>off</option>
							</select>
						{:else if c.type === 'text'}
							<input name="value" value={c.live ?? ''} maxlength="32" placeholder="(empty)" class="{input} w-32 px-2 py-1 text-xs" />
						{:else}
							<input
								name="value"
								type="number"
								min={c.type.min}
								max={c.type.max}
								step={c.type.float ? 0.25 : 1}
								value={c.live ?? ''}
								required
								class="{input} w-24 px-2 py-1 text-xs"
							/>
						{/if}
						<button formaction="?/apply" class={small}>Apply</button>
						<button formaction="?/save" class={small}>Save as default</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
