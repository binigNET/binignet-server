<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Table from '$lib/components/ui/table';
	import { GAME_IDS, HLDS_GAMES } from '$lib/games';
	import { latest } from '$lib/latest.svelte';

	let { data } = $props();
	const h = $derived(data.health!);
	const servers = latest(() => data.servers);

	const rows = $derived([
		['pvpgn telnet', h.telnet.state === 'ready', h.telnet.state + (h.telnet.error ? ` — ${h.telnet.error}` : '')],
		['pvpgn database', h.db, h.db ? 'connected' : 'unreachable'],
		['status file', h.statusAgeS !== null && h.statusAgeS < 60, h.statusAgeS === null ? 'missing' : `updated ${h.statusAgeS}s ago`],
		['aura database', h.auraDb, h.auraDb ? 'found' : 'missing'],
		...(servers.value ?? []).map(
			(s) =>
				[
					`${HLDS_GAMES[s.game].label} server`,
					!!s.info,
					s.info
						? `${s.info.map}, ${s.info.players - s.info.bots}/${s.info.maxPlayers} players (via ${s.source === 'rcon' ? 'rcon' : 'query'})`
						: s.error
				] as const
		)
	]);
</script>

<h1 class="mb-4 text-xl font-semibold">Overview</h1>
<Table.Root>
	<Table.Body>
		{#each rows as [name, ok, detail]}
			<Table.Row>
				<Table.Cell class="font-medium">{name}</Table.Cell>
				<Table.Cell>
					<Badge class={ok ? 'bg-success text-success-foreground' : ''} variant={ok ? 'default' : 'destructive'}>{ok ? 'ok' : 'down'}</Badge>
				</Table.Cell>
				<Table.Cell class="whitespace-normal text-muted-foreground">{detail}</Table.Cell>
			</Table.Row>
		{/each}
		{#if !servers.value}
			{#each GAME_IDS as g (g)}
				<Table.Row>
					<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
					<Table.Cell><Skeleton class="h-4 w-10" /></Table.Cell>
					<Table.Cell><Skeleton class="h-4 w-48" /></Table.Cell>
				</Table.Row>
			{/each}
		{/if}
	</Table.Body>
</Table.Root>
