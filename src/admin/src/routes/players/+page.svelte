<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import Flash from '$lib/Flash.svelte';
	import { ago, localDateTime } from '$lib/format';
	import { button, input, small } from '$lib/styles';
	import { autoRefresh } from '$lib/refresh.svelte';

	let { data, form } = $props();
	// page 1 is the live view; later pages and searches stay still while browsing
	autoRefresh(15_000, () => data.page === 1 && !data.q);

	// dates in the viewer's timezone: render after hydration only
	let mounted = $state(false);
	onMount(() => (mounted = true));

	const href = (page: number) => `?${new URLSearchParams({ ...(data.q ? { q: data.q } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`;
</script>

<div class="mb-1 flex items-baseline gap-3">
	<h1 class="text-xl font-semibold">Players</h1>
	<span class="text-sm text-zinc-400">
		{data.online} online · {data.accounts} accounts
		{#if data.updatedAt}· status {ago(data.updatedAt)}{/if}
	</span>
</div>
<p class="mb-4 flex gap-4 text-xs text-zinc-400">
	<span><span class="inline-block size-2 rounded-full bg-emerald-400"></span> online</span>
	<span><span class="inline-block size-2 rounded-full bg-orange-400"></span> bot online</span>
	<span><span class="inline-block size-2 rounded-full ring-1 ring-orange-400"></span> bot offline</span>
</p>

{#if !data.updatedAt}
	<p class="mb-2 text-sm text-amber-400">Status file missing — online state unknown.</p>
{/if}
{#if data.dbError}
	<p class="mb-2 text-sm text-red-400">Database unreachable ({data.dbError}) — showing online players only.</p>
{/if}

<form method="GET" class="mb-3 flex items-center gap-2">
	<input name="q" value={data.q} placeholder="Search name" class="{input} w-56" />
	<button class={small}>Search</button>
	{#if data.q}<a href="?" class="text-xs text-zinc-400 hover:text-zinc-100">clear</a>{/if}
</form>

{#if !data.rows.length}
	<p class="text-sm text-zinc-400">{data.q ? 'No players match.' : 'No accounts yet.'}</p>
{:else}
	<table class="w-full text-left text-sm">
		<thead class="text-zinc-400">
			<tr><th class="py-2">Name</th><th>Client</th><th>Game</th><th>Last login</th></tr>
		</thead>
		<tbody>
			{#each data.rows as p (p.name)}
				<tr class="border-t border-zinc-800">
					<td class="py-2">
						<span class="mr-2 inline-block size-2 rounded-full {p.bot ? (p.online ? 'bg-orange-400' : 'ring-1 ring-orange-400') : p.online ? 'bg-emerald-400' : ''}"></span>
						<a href="/players/{encodeURIComponent(p.name)}" class="hover:underline {p.online ? '' : 'text-zinc-300'}">{p.name}</a>
					</td>
					<td>{p.clienttag ?? '—'}</td>
					<td>{p.game ?? '—'}</td>
					<td class="text-zinc-400">
						{#if p.online}<span class="text-emerald-400">online now</span>
						{:else if !p.lastLogin}never
						{:else if mounted}{localDateTime(p.lastLogin)}{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

{#if data.pages > 1}
	<nav class="mt-3 flex items-center gap-3 text-sm">
		{#if data.page > 1}<a href={href(data.page - 1)} class={small}>← Prev</a>{:else}<span class="{small} opacity-40">← Prev</span>{/if}
		<span class="text-zinc-400">Page {data.page} of {data.pages} · {data.total} players</span>
		{#if data.page < data.pages}<a href={href(data.page + 1)} class={small}>Next →</a>{:else}<span class="{small} opacity-40">Next →</span>{/if}
	</nav>
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
