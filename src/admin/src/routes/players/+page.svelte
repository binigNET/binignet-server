<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { ago } from '$lib/format';
	import { button, input } from '$lib/styles';
	import { autoRefresh } from '$lib/refresh.svelte';

	let { data, form } = $props();
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

<section class="mt-10">
	<h2 class="mb-2 font-medium">Create player</h2>
	<form method="POST" action="?/create" use:enhance class="flex flex-wrap gap-2">
		<input name="user" required maxlength="15" placeholder="Username" autocomplete="off" class="{input} w-44" />
		<input name="password" required minlength="3" placeholder="Password" autocomplete="new-password" class="{input} w-44" />
		<button class={button}>Create</button>
	</form>
	<Flash {form} name="create" />
</section>
