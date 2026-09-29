<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { until } from '$lib/format';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Bans</h1>

<section class="mb-8">
	<h2 class="mb-2 font-medium">IP bans</h2>
	<form method="POST" action="?/ipban" use:enhance class="mb-3 flex flex-wrap gap-2">
		<input name="ip" required placeholder="IP, e.g. 1.2.3.4 or 1.2.*.*" class="{input} w-56 font-mono" />
		<input name="minutes" type="number" min="0" value="0" title="minutes, 0 = permanent" class="{input} w-28" />
		<span class="self-center text-xs text-zinc-400">min (0 = permanent)</span>
		<button class={button}>Ban IP</button>
	</form>
	<Flash {form} name="ipban" />
	{#if data.ips === null}
		<p class="text-sm text-red-400">Can't read bnban.conf.</p>
	{:else if !data.ips.length}
		<p class="text-sm text-zinc-400">None.</p>
	{:else}
		<table class="w-full text-left text-sm">
			<thead class="text-zinc-400"><tr><th class="py-2">IP / range</th><th>Until</th><th></th></tr></thead>
			<tbody>
				{#each data.ips as b (b.ip)}
					<tr class="border-t border-zinc-800">
						<td class="py-2 font-mono">{b.ip}</td>
						<td>{until(b.until)}</td>
						<td class="text-right">
							<form method="POST" action="?/ipunban" use:enhance>
								<input type="hidden" name="ip" value={b.ip} /><button class={small}>Unban</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

{#each [['lock', 'unlock', 'Locked accounts', 'Lock', 'Unlock', data.locked], ['mute', 'unmute', 'Muted accounts', 'Mute', 'Unmute', data.muted]] as const as [name, undo, title, verb, undoVerb, rows]}
	<section class="mb-8">
		<h2 class="mb-2 font-medium">{title}</h2>
		<form method="POST" action="?/{name}" use:enhance class="mb-3 flex flex-wrap gap-2">
			<input name="user" required placeholder="Account" class="{input} w-40" />
			<input name="hours" type="number" min="0" value="0" title="hours, 0 = permanent" class="{input} w-24" />
			<span class="self-center text-xs text-zinc-400">h (0 = permanent)</span>
			<input name="reason" placeholder="Reason" class="{input} flex-1" />
			<button class={button}>{verb}</button>
		</form>
		<Flash {form} {name} />
		{#if rows === null}
			<p class="text-sm text-red-400">Database unreachable.</p>
		{:else if !rows.length}
			<p class="text-sm text-zinc-400">None.</p>
		{:else}
			<table class="w-full text-left text-sm">
				<thead class="text-zinc-400"><tr><th class="py-2">Account</th><th>Until</th><th>Reason</th><th></th></tr></thead>
				<tbody>
					{#each rows as b (b.username)}
						<tr class="border-t border-zinc-800">
							<td class="py-2">{b.username}</td><td>{until(b.until)}</td><td>{b.reason || '—'}</td>
							<td class="text-right">
								<form method="POST" action="?/{undo}" use:enhance>
									<input type="hidden" name="user" value={b.username} /><button class={small}>{undoVerb}</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/each}
