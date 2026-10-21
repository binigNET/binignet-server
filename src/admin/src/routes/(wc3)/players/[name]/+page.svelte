<script lang="ts">
	import { onMount } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import * as Table from '$lib/components/ui/table';
	import DurationReason from '$lib/DurationReason.svelte';
	import { localDateTime, until } from '$lib/format';
	import { findIcon, iconSrc, RACES } from '$lib/icons';
	import { submit } from '$lib/submit';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let mounted = $state(false);
	onMount(() => (mounted = true));
	const p = $derived(data.player);
	// writable deriveds reset to saved values after each load; not deep-reactive, so reassign, don't mutate
	let stats = $derived({ ...p.stats });
	let icon = $derived(p.icon);
	let tab = $derived(RACES.find((r) => r.icons.some((i) => i.code === p.icon))?.key ?? 'H');
	const current = $derived(findIcon(icon));
	const saved = $derived(findIcon(p.icon));
	const d = $derived(p.details);
	// highest of solo/team/ffa, like pvpgn's statstring
	const level = $derived(Math.max(...data.ladders.map((l) => p.stats[`${l}_level`])));
	// viewer's timezone → client-side only
	const when = (x: Date | null) => (!x ? '—' : mounted ? localDateTime(x) : '');
	const raceLabel = { humans: 'Human', orcs: 'Orc', nightelves: 'Night Elf', undead: 'Undead', random: 'Random' };
	let newPass = $state('');
	function genPass() {
		const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
		newPass = Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => abc[n % abc.length]).join('');
	}
	const KICK_BANS = [
		[0, 'No ban'],
		[10, '+ IP ban 10 min'],
		[60, '+ IP ban 1 h'],
		[1440, '+ IP ban 1 day']
	] as const;
	const profile = $derived(
		(
			[
				['Sex', d.profile.sex],
				['Age', d.profile.age],
				['Location', d.profile.location],
				['Clan', d.profile.clan],
				['Description', d.profile.description]
			] as const
		).filter(([, v]) => v)
	);
</script>

<Button href="/players" size="sm" variant="ghost" class="-ml-2"><ArrowLeft /> Players</Button>
<h1 class="mt-2 mb-4 flex flex-wrap items-center gap-3 text-xl font-semibold">
	{#if saved}<img src={iconSrc(saved.code)} alt={saved.name} title={saved.name} class="h-8 rounded-sm" />{/if}
	{p.username}
	<Badge class="bg-warning text-warning-foreground">Lv {level}</Badge>
	{#if data.deleted}<Badge variant="destructive">Deleted</Badge>{/if}
	{#if data.online}
		<Badge class="bg-success text-success-foreground">Online</Badge>
	{:else}
		<Badge variant="secondary">Offline</Badge>
	{/if}
	<span class="text-sm font-normal text-muted-foreground">uid {p.uid}</span>
</h1>

<Card.Root class="mb-6 max-w-3xl">
	<Card.Content class="grid gap-x-8 gap-y-6 text-sm sm:grid-cols-2">
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
			<dt class="text-muted-foreground">Email</dt>
			<dd>{d.email ?? '—'}{#if d.email}<span class="ml-2 text-xs {d.emailVerified ? 'text-success' : 'text-muted-foreground'}">{d.emailVerified ? 'verified' : 'unverified'}</span>{/if}</dd>
			<dt class="text-muted-foreground">Created</dt>
			<dd>{when(d.created)}</dd>
			<dt class="text-muted-foreground">Last login</dt>
			<dd>{when(d.lastLogin)}{#if d.lastClient}<span class="ml-2 text-muted-foreground">{d.lastClient}</span>{/if}</dd>
			<dt class="text-muted-foreground">Last IP</dt>
			<dd class="font-mono text-xs leading-5">{d.lastIp ?? '—'}</dd>
			<dt class="text-muted-foreground">Last owner</dt>
			<dd>{d.lastOwner ?? '—'}</dd>
			{#if data.online}
				<dt class="text-muted-foreground">Country</dt>
				<dd>{data.online.country ?? '—'}</dd>
				<dt class="text-muted-foreground">Client</dt>
				<dd>{data.online.clienttag} <span class="text-muted-foreground">{data.online.version}</span></dd>
				<dt class="text-muted-foreground">In game</dt>
				<dd>{data.online.game ?? '—'}</dd>
			{/if}
		</dl>
		<div class="space-y-4">
			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
				<dt class="text-muted-foreground">Roles</dt>
				<dd>{[d.admin && 'admin', d.operator && 'operator'].filter(Boolean).join(', ') || '—'}</dd>
				<dt class="text-muted-foreground">Cmd groups</dt>
				<dd>{d.commandGroups ?? '—'}</dd>
				<dt class="text-muted-foreground">Locked</dt>
				<dd class={d.locked ? 'text-destructive' : ''}>{d.locked ? `until ${until(d.lockUntil)}${d.lockReason ? ` — ${d.lockReason}` : ''}` : 'no'}</dd>
				<dt class="text-muted-foreground">Muted</dt>
				<dd class={d.muted ? 'text-destructive' : ''}>{d.muted ? `until ${until(d.muteUntil)}${d.muteReason ? ` — ${d.muteReason}` : ''}` : 'no'}</dd>
				{#each profile as [k, v]}
					<dt class="text-muted-foreground">{k}</dt>
					<dd class="break-words">{v}</dd>
				{/each}
			</dl>
			<table class="text-xs">
				<thead class="text-muted-foreground"><tr><th class="pr-4 text-left">Race</th><th class="pr-3 text-right">W</th><th class="text-right">L</th></tr></thead>
				<tbody>
					{#each Object.entries(d.races) as [k, v]}
						<tr><td class="pr-4">{raceLabel[k as keyof typeof raceLabel]}</td><td class="pr-3 text-right">{v.wins}</td><td class="text-right">{v.losses}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card.Content>
</Card.Root>

<form method="POST" action="?/save" use:submit={{ reset: false }}>
	<Card.Root class="mb-6 max-w-3xl">
		<Card.Header>
			<Card.Title>WC3 TFT ladder</Card.Title>
			<Card.Description>Arranged team (AT) stats are per team and not editable here.</Card.Description>
			<Card.Action>
				<Button
					size="sm"
					variant="outline"
					title="Fill inputs only; review then Save"
					onclick={() => (stats = Object.fromEntries(data.ladders.flatMap((l) => data.fields.map((f) => [`${l}_${f}`, data.max[f]]))) as typeof stats)}
				>Max all</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<Table.Root class="w-auto">
				<Table.Header>
					<Table.Row><Table.Head></Table.Head>{#each data.fields as f}<Table.Head class="capitalize">{f}</Table.Head>{/each}</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.ladders as l}
						<Table.Row>
							<Table.Cell class="capitalize">{l}</Table.Cell>
							{#each data.fields as f}
								<Table.Cell>
									<Input type="number" min={0} name="{l}_{f}" bind:value={stats[`${l}_${f}`]} class="h-7 w-24" />
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root class="mb-6 max-w-3xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				Icon
				{#if current}
					<img src={iconSrc(current.code)} alt="" class="h-6 rounded-sm" />
					<span class="text-sm font-normal text-muted-foreground">{current.name} ({current.code})</span>
				{:else}
					<span class="text-sm font-normal text-muted-foreground">{icon ? `${icon} (custom)` : 'Auto (rank by level)'}</span>
				{/if}
			</Card.Title>
			<Card.Description>Sets Record\W3XP\userselected_icon; overrides rank icon. Player must rejoin channel / relog to see change.</Card.Description>
		</Card.Header>
		<Card.Content>
			<input type="hidden" name="icon" value={icon} />
			<div class="mb-2 flex flex-wrap gap-1">
				<Button size="sm" variant={icon === '' ? 'secondary' : 'outline'} onclick={() => (icon = '')}>Auto (rank by level)</Button>
				<span class="mx-1 border-l"></span>
				{#each RACES as r}
					<Button size="sm" variant={tab === r.key ? 'secondary' : 'outline'} onclick={() => (tab = r.key)}>{r.label}</Button>
				{/each}
			</div>
			<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
				{#each RACES.find((r) => r.key === tab)?.icons ?? [] as i}
					<button
						type="button"
						aria-pressed={icon === i.code}
						onclick={() => (icon = i.code)}
						class={cn(
							'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors',
							icon === i.code ? 'border-primary bg-primary/10' : 'hover:bg-muted'
						)}
					>
						<img src={iconSrc(i.code)} alt="" class="h-[42px] w-16 rounded-sm" />
						<span class="text-center leading-tight">{i.name}</span>
						<span class="text-muted-foreground">{i.code}</span>
					</button>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<Button type="submit" loadingText="Saving… (pvpgn rate limit, ~1s per change)">Save changes</Button>
</form>

<Card.Root class="mt-8 max-w-3xl">
	<Card.Header><Card.Title>Actions</Card.Title></Card.Header>
	<Card.Content class="space-y-4">
		{#if data.online}
			<form method="POST" action="?/kick" use:submit class="flex flex-wrap items-center gap-2">
				<span class="w-20 text-sm text-muted-foreground">Kick</span>
				<NativeSelect.Root name="minutes" class="w-40">
					{#each KICK_BANS as [m, label]}<NativeSelect.Option value={m}>{label}</NativeSelect.Option>{/each}
				</NativeSelect.Root>
				<Button type="submit">Kick</Button>
			</form>
		{/if}

		{#each [['lock', 'Lock', d.locked], ['mute', 'Mute', d.muted]] as const as [name, verb, active]}
			{#if active}
				<form method="POST" action="?/un{name}" use:submit class="flex flex-wrap items-center gap-2">
					<span class="w-20 text-sm text-muted-foreground">{verb}</span>
					<Button type="submit">Un{name}</Button>
				</form>
			{:else}
				<form method="POST" action="?/{name}" use:submit class="flex flex-wrap items-center gap-2">
					<span class="w-20 text-sm text-muted-foreground">{verb}</span>
					<DurationReason />
					<Button type="submit">{verb}</Button>
				</form>
			{/if}
		{/each}

		<form method="POST" action="?/chpass" use:submit class="flex flex-wrap items-center gap-2">
			<span class="w-20 text-sm text-muted-foreground">Password</span>
			<Input name="password" bind:value={newPass} required minlength={3} placeholder="New password" autocomplete="new-password" class="w-48 font-mono" />
			<Button variant="outline" onclick={genPass}>Generate</Button>
			<Button type="submit">Set password</Button>
			<!-- pvpgn /chpass sets passhash1 only; WC3 logs in via salt+verifier (set at signup / in-game change) -->
			<p class="w-full text-xs text-warning">
				Won't change the WC3 login: accounts that have logged in from WC3 keep their old password in-game and on this dashboard.
			</p>
		</form>

		{#if !data.deleted}
			<form
				method="POST"
				action="?/delete"
				use:submit={{ confirm: { title: `Delete ${p.username}?`, body: 'Locks permanently and kicks; unlock to restore.', action: 'Delete', destructive: true } }}
				class="flex flex-wrap items-center gap-2"
			>
				<span class="w-20 text-sm text-muted-foreground">Delete</span>
				<Button type="submit" variant="destructive">Delete account</Button>
				<span class="text-xs text-muted-foreground">Soft delete: permanent lock + kick. Unlock to restore.</span>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
