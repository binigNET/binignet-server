<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { localDateTime, until } from '$lib/format';
	import { findIcon, iconSrc, RACES } from '$lib/icons';
	import { button, input, small } from '$lib/styles';

	let { data, form } = $props();
	let saving = $state(false);
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

<a href="/players" class="text-sm text-zinc-400 hover:text-zinc-100">← Players</a>
<h1 class="mt-2 mb-4 flex flex-wrap items-center gap-3 text-xl font-semibold">
	{#if saved}<img src={iconSrc(saved.code)} alt={saved.name} title={saved.name} class="h-8 rounded-sm" />{/if}
	{p.username}
	<span class="rounded bg-amber-400/15 px-2 py-0.5 text-sm font-medium text-amber-300">Lv {level}</span>
	{#if data.online}
		<span class="rounded bg-emerald-500/15 px-2 py-0.5 text-sm font-medium text-emerald-300">Online</span>
	{:else}
		<span class="rounded bg-zinc-700/50 px-2 py-0.5 text-sm font-medium text-zinc-400">Offline</span>
	{/if}
	<span class="text-sm font-normal text-zinc-400">uid {p.uid}</span>
</h1>

<section class="mb-8 grid max-w-3xl gap-x-8 gap-y-6 rounded border border-zinc-800 p-4 text-sm sm:grid-cols-2">
	<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
		<dt class="text-zinc-400">Email</dt>
		<dd>{d.email ?? '—'}{#if d.email}<span class="ml-2 text-xs {d.emailVerified ? 'text-emerald-400' : 'text-zinc-500'}">{d.emailVerified ? 'verified' : 'unverified'}</span>{/if}</dd>
		<dt class="text-zinc-400">Created</dt>
		<dd>{when(d.created)}</dd>
		<dt class="text-zinc-400">Last login</dt>
		<dd>{when(d.lastLogin)}{#if d.lastClient}<span class="ml-2 text-zinc-500">{d.lastClient}</span>{/if}</dd>
		<dt class="text-zinc-400">Last IP</dt>
		<dd class="font-mono text-xs leading-5">{d.lastIp ?? '—'}</dd>
		<dt class="text-zinc-400">Last owner</dt>
		<dd>{d.lastOwner ?? '—'}</dd>
		{#if data.online}
			<dt class="text-zinc-400">Country</dt>
			<dd>{data.online.country ?? '—'}</dd>
			<dt class="text-zinc-400">Client</dt>
			<dd>{data.online.clienttag} <span class="text-zinc-500">{data.online.version}</span></dd>
			<dt class="text-zinc-400">In game</dt>
			<dd>{data.online.game ?? '—'}</dd>
		{/if}
	</dl>
	<div class="space-y-4">
		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
			<dt class="text-zinc-400">Roles</dt>
			<dd>{[d.admin && 'admin', d.operator && 'operator'].filter(Boolean).join(', ') || '—'}</dd>
			<dt class="text-zinc-400">Cmd groups</dt>
			<dd>{d.commandGroups ?? '—'}</dd>
			<dt class="text-zinc-400">Locked</dt>
			<dd class={d.locked ? 'text-red-400' : ''}>{d.locked ? `until ${until(d.lockUntil)}${d.lockReason ? ` — ${d.lockReason}` : ''}` : 'no'}</dd>
			<dt class="text-zinc-400">Muted</dt>
			<dd class={d.muted ? 'text-red-400' : ''}>{d.muted ? `until ${until(d.muteUntil)}${d.muteReason ? ` — ${d.muteReason}` : ''}` : 'no'}</dd>
			{#each profile as [k, v]}
				<dt class="text-zinc-400">{k}</dt>
				<dd class="break-words">{v}</dd>
			{/each}
		</dl>
		<table class="text-xs">
			<thead class="text-zinc-400"><tr><th class="pr-4 text-left">Race</th><th class="pr-3 text-right">W</th><th class="text-right">L</th></tr></thead>
			<tbody>
				{#each Object.entries(d.races) as [k, v]}
					<tr><td class="pr-4">{raceLabel[k as keyof typeof raceLabel]}</td><td class="pr-3 text-right">{v.wins}</td><td class="text-right">{v.losses}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<form method="POST" use:enhance={() => { saving = true; return async ({ update }) => { await update({ reset: false }); saving = false; }; }}>
	<h2 class="mb-2 flex items-center gap-3 font-medium">
		WC3 TFT ladder
		<button
			type="button"
			class={small}
			title="Fill inputs only; review then Save"
			onclick={() => (stats = Object.fromEntries(data.ladders.flatMap((l) => data.fields.map((f) => [`${l}_${f}`, data.max[f]]))) as typeof stats)}
		>Max all</button>
	</h2>
	<table class="mb-6 text-sm">
		<thead class="text-zinc-400">
			<tr><th class="pr-4 text-left"></th>{#each data.fields as f}<th class="px-1 text-left capitalize">{f}</th>{/each}</tr>
		</thead>
		<tbody>
			{#each data.ladders as l}
				<tr>
					<td class="pr-4 py-1 capitalize">{l}</td>
					{#each data.fields as f}
						<td class="px-1 py-1">
							<input type="number" min="0" name="{l}_{f}" bind:value={stats[`${l}_${f}`]} class="{input} w-24 py-1" />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<p class="-mt-4 mb-6 text-xs text-zinc-400">Arranged team (AT) stats are per team and not editable here.</p>

	<h2 class="mb-2 flex items-center gap-2 font-medium">
		Icon
		{#if current}
			<img src={iconSrc(current.code)} alt="" class="h-6 rounded-sm" />
			<span class="text-sm font-normal text-zinc-400">{current.name} ({current.code})</span>
		{:else}
			<span class="text-sm font-normal text-zinc-400">{icon ? `${icon} (custom)` : 'Auto (rank by level)'}</span>
		{/if}
	</h2>
	<input type="hidden" name="icon" value={icon} />
	<div class="mb-2 flex flex-wrap gap-1">
		<button type="button" class="{small} {icon === '' ? 'border-zinc-300 bg-zinc-800' : ''}" onclick={() => (icon = '')}>Auto (rank by level)</button>
		<span class="mx-1 border-l border-zinc-700"></span>
		{#each RACES as r}
			<button type="button" class="{small} {tab === r.key ? 'border-zinc-300 bg-zinc-800' : ''}" onclick={() => (tab = r.key)}>{r.label}</button>
		{/each}
	</div>
	<div class="mb-1 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-6">
		{#each RACES.find((r) => r.key === tab)?.icons ?? [] as i}
			<button
				type="button"
				aria-pressed={icon === i.code}
				onclick={() => (icon = i.code)}
				class="flex flex-col items-center gap-1 rounded border p-2 text-xs {icon === i.code ? 'border-amber-400 bg-zinc-800' : 'border-zinc-700 hover:bg-zinc-800'}"
			>
				<img src={iconSrc(i.code)} alt="" class="h-[42px] w-16 rounded-sm" />
				<span class="text-center leading-tight">{i.name}</span>
				<span class="text-zinc-500">{i.code}</span>
			</button>
		{/each}
	</div>
	<p class="mb-6 text-xs text-zinc-400">Sets Record\W3XP\userselected_icon; overrides rank icon. Player must rejoin channel / relog to see change.</p>

	<button class={button} disabled={saving}>{saving ? 'Saving… (pvpgn rate limit, ~1s per change)' : 'Save changes'}</button>
	<Flash {form} name="player" />
</form>
