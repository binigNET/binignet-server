<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { ago, localDateTime } from '$lib/format';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { submit } from '$lib/submit';

	let { data } = $props();
	// page 1 is the live view; later pages and searches stay still while browsing
	autoRefresh(15_000, () => data.page === 1 && !data.q);

	// dates in the viewer's timezone: render after hydration only
	let mounted = $state(false);
	onMount(() => (mounted = true));

	const href = (page: number) => `?${new URLSearchParams({ ...(data.q ? { q: data.q } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`;
</script>

<div class="mb-1 flex items-baseline gap-3">
	<h1 class="text-xl font-semibold">Players</h1>
	<span class="text-sm text-muted-foreground">
		{data.online} online · {data.accounts} accounts
		{#if data.updatedAt}· status {ago(data.updatedAt)}{/if}
	</span>
</div>
<p class="mb-4 flex gap-4 text-xs text-muted-foreground">
	<span><span class="inline-block size-2 rounded-full bg-success"></span> online</span>
	<span><span class="inline-block size-2 rounded-full bg-chart-3"></span> bot online</span>
	<span><span class="inline-block size-2 rounded-full ring-1 ring-chart-3"></span> bot offline</span>
</p>

{#if !data.updatedAt}
	<p class="mb-2 text-sm text-warning">Status file missing — online state unknown.</p>
{/if}
{#if data.dbError}
	<p class="mb-2 text-sm text-destructive">Database unreachable ({data.dbError}) — showing online players only.</p>
{/if}

<form method="GET" class="mb-3 flex items-center gap-2">
	<Input name="q" value={data.q} placeholder="Search name" class="w-56" />
	<Button type="submit" size="sm" variant="outline">Search</Button>
	{#if data.q}<Button href="?" size="sm" variant="ghost">Clear</Button>{/if}
</form>

{#if !data.rows.length}
	<p class="text-sm text-muted-foreground">{data.q ? 'No players match.' : 'No accounts yet.'}</p>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row><Table.Head>Name</Table.Head><Table.Head>Client</Table.Head><Table.Head>Game</Table.Head><Table.Head>Last login</Table.Head></Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.rows as p (p.name)}
				<Table.Row>
					<Table.Cell>
						<span class="mr-2 inline-block size-2 rounded-full {p.bot ? (p.online ? 'bg-chart-3' : 'ring-1 ring-chart-3') : p.online ? 'bg-success' : ''}"></span>
						<a href="/players/{encodeURIComponent(p.name)}" class="hover:underline {p.deleted ? 'text-muted-foreground line-through' : p.online ? '' : 'text-foreground/80'}">{p.name}</a>
						{#if p.deleted}<Badge variant="destructive" class="ml-2">deleted</Badge>{/if}
					</Table.Cell>
					<Table.Cell>{p.clienttag ?? '—'}</Table.Cell>
					<Table.Cell>{p.game ?? '—'}</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{#if p.online}<span class="text-success">online now</span>
						{:else if !p.lastLogin}never
						{:else if mounted}{localDateTime(p.lastLogin)}{/if}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}

{#if data.pages > 1}
	<nav class="mt-3 flex items-center gap-3 text-sm">
		<Button href={data.page > 1 ? href(data.page - 1) : undefined} disabled={data.page <= 1} size="sm" variant="outline">← Prev</Button>
		<span class="text-muted-foreground">Page {data.page} of {data.pages} · {data.total} players</span>
		<Button href={data.page < data.pages ? href(data.page + 1) : undefined} disabled={data.page >= data.pages} size="sm" variant="outline">Next →</Button>
	</nav>
{/if}

<Card.Root class="mt-8 max-w-xl">
	<Card.Header><Card.Title>Create player</Card.Title></Card.Header>
	<Card.Content>
		<form method="POST" action="?/create" use:submit class="flex flex-wrap gap-2">
			<Input name="user" required maxlength={15} placeholder="Username" autocomplete="off" class="w-44" />
			<Input name="password" required minlength={3} placeholder="Password" autocomplete="new-password" class="w-44" />
			<Button type="submit">Create</Button>
		</form>
	</Card.Content>
</Card.Root>
