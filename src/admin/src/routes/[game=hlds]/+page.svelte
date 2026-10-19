<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import * as Popover from '$lib/components/ui/popover';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Table from '$lib/components/ui/table';
	import DurationReason from '$lib/DurationReason.svelte';
	import { latest } from '$lib/latest.svelte';
	import { autoRefresh } from '$lib/refresh.svelte';
	import { submit } from '$lib/submit';

	let { data } = $props();
	autoRefresh(10_000);

	const server = latest(() => data.server);
	const maps = latest(() => data.maps);
	const info = $derived(server.value?.info);
	const players = $derived(server.value?.players ?? []);
	const bots = $derived(server.value?.bots ?? 0);
	const error = $derived(
		server.value && !server.value.players
			? `player list needs rcon (${server.value.rcon.error || server.value.error || 'unavailable'})`
			: ''
	);
	// $state, not $derived: autoRefresh reloads data and would reset the pick; set once data arrives
	let map = $state('');
	$effect(() => {
		if (!map) map = info?.map ?? maps.value?.cycle[0] ?? maps.value?.other[0] ?? '';
	});
	let custom = $state('');
	const sk = $derived(data.botCfg.skill);
</script>

{#if !server.value}
	<div class="mb-6 space-y-2"><Skeleton class="h-4 w-64" /><Skeleton class="h-4 w-40" /><Skeleton class="h-4 w-52" /></div>
{:else if info}
	<dl class="mb-6 grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
		<dt class="text-muted-foreground">Hostname</dt>
		<dd>{info.name}</dd>
		<dt class="text-muted-foreground">Map</dt>
		<dd class="font-mono">{info.map}</dd>
		<dt class="text-muted-foreground">Players</dt>
		<dd>{info.players - info.bots} / {info.maxPlayers}{info.bots ? ` (+${info.bots} bots)` : ''}</dd>
	</dl>
{/if}

<div class="mb-6 grid gap-4 md:grid-cols-2">
	<Card.Root>
		<Card.Header><Card.Title>Map</Card.Title></Card.Header>
		<Card.Content class="space-y-3">
			<form method="POST" action="?/map" use:submit={{ confirm: `Change map to ${custom.trim() || map}?`, reset: false }} class="flex flex-wrap items-center gap-2">
				{#if !maps.value}
					<Skeleton class="h-8 w-48" />
				{:else}
					<NativeSelect.Root name="map" bind:value={map} class="max-w-56">
						{#if maps.value.cycle.length}
							<NativeSelect.OptGroup label="Map cycle">{#each maps.value.cycle as m}<NativeSelect.Option value={m}>{m}</NativeSelect.Option>{/each}</NativeSelect.OptGroup>
						{/if}
						{#if maps.value.other.length}
							<NativeSelect.OptGroup label="Other">{#each maps.value.other as m}<NativeSelect.Option value={m}>{m}</NativeSelect.Option>{/each}</NativeSelect.OptGroup>
						{/if}
					</NativeSelect.Root>
				{/if}
				<Input name="custom" bind:value={custom} maxlength={64} placeholder="or type a map" class="w-40" />
				<Button type="submit">Change map</Button>
			</form>
			<form method="POST" action="?/restart" use:submit={{ confirm: `${data.restartLabel}?` }}>
				<Button type="submit" size="sm" variant="outline">{data.restartLabel}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Bots <span class="text-sm font-normal text-muted-foreground">({bots} in game)</span></Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<form method="POST" action="?/kickbots" use:submit={{ confirm: { title: `Kick all ${bots} bots?`, destructive: true } }}>
					<Button type="submit" size="sm" variant="destructive" disabled={!bots}>Kick all bots</Button>
				</form>
				<form method="POST" action="?/readdbots" use:submit>
					<Button type="submit" size="sm" variant="outline">Re-add bots ({data.botCfg.defaults.bots})</Button>
				</form>
				<form method="POST" action="?/addbots" use:submit={{ reset: false }} class="flex gap-1">
					<Input name="n" type="number" min={1} max={31} value={1} class="h-7 w-16" />
					<Button type="submit" size="sm" variant="outline">Add</Button>
				</form>
			</div>
			<form method="POST" action="?/botskill" use:submit={{ reset: false }} class="flex items-center gap-1">
				<Input name="skill" type="number" min={sk.min} max={sk.max} value={data.botCfg.defaults.skill} class="h-7 w-16" />
				<Button type="submit" size="sm" variant="outline">Set skill</Button>
				<span class="text-xs text-muted-foreground">{sk.hint}</span>
			</form>
			<details class="text-sm">
				<summary class="cursor-pointer text-muted-foreground">Defaults (server start)</summary>
				<form method="POST" action="?/savebots" use:submit={{ reset: false }} class="mt-2 flex flex-wrap items-center gap-2">
					<label class="flex items-center gap-1 text-xs">Bots <Input name="bots" type="number" min={0} max={31} value={data.botCfg.defaults.bots} class="h-7 w-16" /></label>
					<label class="flex items-center gap-1 text-xs">Skill <Input name="skill" type="number" min={sk.min} max={sk.max} value={data.botCfg.defaults.skill} class="h-7 w-16" /></label>
					<Button type="submit" size="sm" variant="outline">Save as default</Button>
				</form>
			</details>
		</Card.Content>
	</Card.Root>
</div>

<Card.Root class="mb-6">
	<Card.Header><Card.Title>Say</Card.Title></Card.Header>
	<Card.Content>
		<form method="POST" action="?/say" use:submit class="flex flex-wrap items-center gap-2">
			<Input name="msg" required maxlength={190} placeholder="Message to all players" class="w-auto min-w-60 flex-1" />
			<NativeSelect.Root name="mode" class="w-28">
				<NativeSelect.Option value="chat">Chat</NativeSelect.Option>
				<NativeSelect.Option value="center">Centre</NativeSelect.Option>
				<NativeSelect.Option value="hud">HUD</NativeSelect.Option>
			</NativeSelect.Root>
			<Button type="submit">Send</Button>
		</form>
	</Card.Content>
</Card.Root>

<h2 class="mb-2 font-medium">Players <span class="text-sm font-normal text-muted-foreground">({players.length})</span></h2>
{#if !server.value}
	<div class="space-y-2"><Skeleton class="h-8 w-full" /><Skeleton class="h-8 w-full" /></div>
{:else if error}
	<p class="text-sm text-warning">{error}</p>
{:else if !players.length}
	<p class="text-sm text-muted-foreground">No players online.</p>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>#</Table.Head><Table.Head>Name</Table.Head><Table.Head>ID</Table.Head><Table.Head>IP</Table.Head>
				<Table.Head>Frags</Table.Head><Table.Head>Time</Table.Head><Table.Head>Ping</Table.Head><Table.Head></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each players as p (p.userid)}
				<Table.Row>
					<Table.Cell class="text-muted-foreground">{p.userid}</Table.Cell>
					<Table.Cell>{p.name}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{p.uniqueid}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{p.addr.replace(/:\d+$/, '')}</Table.Cell>
					<Table.Cell>{p.frags}</Table.Cell>
					<Table.Cell>{p.time}</Table.Cell>
					<Table.Cell>{p.ping}</Table.Cell>
					<Table.Cell>
						<div class="flex justify-end gap-1">
							<form method="POST" action="?/kick" use:submit>
								<input type="hidden" name="userid" value={p.userid} />
								<Button type="submit" size="sm" variant="outline">Kick</Button>
							</form>
							<Popover.Root>
								<Popover.Trigger class={buttonVariants({ size: 'sm', variant: 'destructive' })}>Ban</Popover.Trigger>
								<Popover.Content align="end" class="w-96">
									<form
										method="POST"
										action="?/ban"
										use:submit={{ confirm: { title: `Ban ${p.name}?`, destructive: true } }}
										class="flex flex-wrap gap-2"
									>
										<input type="hidden" name="userid" value={p.userid} />
										<input type="hidden" name="uniqueid" value={p.uniqueid} />
										<input type="hidden" name="ip" value={p.addr.replace(/:\d+$/, '')} />
										<NativeSelect.Root name="type" class="w-28">
											<NativeSelect.Option value="both">ID + IP</NativeSelect.Option>
											<NativeSelect.Option value="id">Steam ID</NativeSelect.Option>
											<NativeSelect.Option value="ip">IP</NativeSelect.Option>
										</NativeSelect.Root>
										<DurationReason />
										<Button type="submit" size="sm" variant="destructive">Ban {p.name}</Button>
									</form>
								</Popover.Content>
							</Popover.Root>
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
