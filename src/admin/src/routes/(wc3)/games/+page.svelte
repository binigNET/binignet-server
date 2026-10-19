<script lang="ts">
	import { untrack } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Table from '$lib/components/ui/table';
	import { ago } from '$lib/format';
	import { latest } from '$lib/latest.svelte';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { submit } from '$lib/submit';
	import Updating from '$lib/Updating.svelte';

	let { data } = $props();
	autoRefresh();
	// $state, not $derived: autoRefresh reloads data and would reset the pick
	let map = $state(untrack(() => data.prefillMap || data.hostable.configs[0] || data.hostable.maps[0] || ''));
	const live = latest(() => data.live);
	const games = $derived(live.value?.games ?? []);
	const lobbyOpen = $derived(games.some((g) => g.aura?.lobby));
</script>

<div class="mb-4 flex items-baseline gap-3">
	<h1 class="text-xl font-semibold">Games</h1>
	<span class="text-sm text-muted-foreground">
		{#if live.value}{games.length} active{/if}{#if data.updatedAt} · status {ago(data.updatedAt)}{/if}
	</span>
	<Updating show={live.pending && !!live.value} />
</div>
{#if live.value?.auraError}
	<p class="mb-3 text-sm text-warning">aura unavailable ({live.value.auraError}) — showing pvpgn listing only</p>
{/if}

<Card.Root class="mb-6 max-w-3xl">
	<Card.Header><Card.Title>Host game</Card.Title></Card.Header>
	<Card.Content>
		{#if !data.hostable.configs.length && !data.hostable.maps.length}
			<p class="text-sm text-muted-foreground">No maps. Upload one on the <a href="/maps" class="underline">Maps</a> page.</p>
		{:else}
			<form method="POST" action="?/host" use:submit={{ reset: false }} class="flex flex-wrap items-center gap-2">
				<NativeSelect.Root name="map" bind:value={map} class="max-w-72">
					{#if data.hostable.configs.length}
						<NativeSelect.OptGroup label="Configs">{#each data.hostable.configs as c}<NativeSelect.Option value={c}>{c}</NativeSelect.Option>{/each}</NativeSelect.OptGroup>
					{/if}
					{#if data.hostable.maps.length}
						<NativeSelect.OptGroup label="Maps">{#each data.hostable.maps as m}<NativeSelect.Option value={m}>{m}</NativeSelect.Option>{/each}</NativeSelect.OptGroup>
					{/if}
				</NativeSelect.Root>
				<Input name="name" maxlength={30} placeholder={map.replace(/\.w3[xm]$/i, '').slice(0, 30) || 'Game name'} class="w-56" />
				<NativeSelect.Root name="visibility" class="w-28">
					<NativeSelect.Option value="public">Public</NativeSelect.Option>
					<NativeSelect.Option value="private">Private</NativeSelect.Option>
				</NativeSelect.Root>
				<Button type="submit" disabled={lobbyOpen} loadingText="Hosting… (loading map)">Host</Button>
			</form>
			<p class="mt-2 text-xs text-muted-foreground">
				{#if lobbyOpen}A lobby is already open — aura hosts one at a time.{:else}Lobby closes ~10 min after hosting unless a player in it takes owner (<code>!owner</code> or "Make owner" below).{/if}
			</p>
		{/if}
	</Card.Content>
</Card.Root>

{#if !live.value}
	<div class="space-y-2"><Skeleton class="h-8 w-full" /><Skeleton class="h-8 w-full" /><Skeleton class="h-8 w-full" /></div>
{:else if !games.length}
	<p class="text-sm text-muted-foreground">No games.</p>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head><Table.Head>Map</Table.Head><Table.Head>State</Table.Head><Table.Head>Owner</Table.Head>
				<Table.Head>Slots</Table.Head><Table.Head>Time</Table.Head><Table.Head>Players (pvpgn)</Table.Head><Table.Head></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each games as { aura, pvpgn }, i (i)}
				<Table.Row class="align-top">
					<Table.Cell>{aura?.name ?? pvpgn?.name}</Table.Cell>
					<Table.Cell>{aura?.map ?? '—'}</Table.Cell>
					<Table.Cell>
						{#if aura}
							<Badge class={aura.lobby ? 'bg-success text-success-foreground' : ''}>{aura.lobby ? 'lobby' : 'playing'}</Badge>
						{:else}
							<Badge variant="outline">user-hosted</Badge>
						{/if}
					</Table.Cell>
					<Table.Cell>{aura?.owner ?? '—'}</Table.Cell>
					<Table.Cell>{aura ? `${aura.players}/${aura.slots}` : '—'}</Table.Cell>
					<Table.Cell>{aura ? `${aura.minutes}m` : '—'}</Table.Cell>
					<Table.Cell class="whitespace-normal">
						{#if aura?.lobby}
							<div class="flex flex-wrap items-center gap-1">
								{#each pvpgn?.players ?? [] as pl}
									<form method="POST" action="?/owner" use:submit>
										<input type="hidden" name="user" value={pl} />
										<Button type="submit" size="sm" variant="outline" title="Make {pl} the lobby owner">{pl} → owner</Button>
									</form>
								{/each}
								<form method="POST" action="?/owner" use:submit class="flex gap-1">
									<Input name="user" required maxlength={15} placeholder="player in lobby" class="h-7 w-32" />
									<Button type="submit" size="sm" variant="outline">Make owner</Button>
								</form>
							</div>
						{:else}
							{pvpgn?.players.join(', ') || '—'}
						{/if}
					</Table.Cell>
					<Table.Cell class="text-right">
						{#if aura?.lobby}
							{@const lobby = aura}
							<form method="POST" action="?/unhost" use:submit={{ confirm: { title: `Unhost lobby "${lobby.name}" (${lobby.players}/${lobby.slots})?`, destructive: true } }}>
								<input type="hidden" name="id" value={lobby.id} />
								<Button type="submit" size="sm" variant="destructive">Unhost</Button>
							</form>
						{/if}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
