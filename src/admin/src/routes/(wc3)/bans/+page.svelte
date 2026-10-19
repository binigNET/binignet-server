<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import DurationReason from '$lib/DurationReason.svelte';
	import { until } from '$lib/format';
	import { submit } from '$lib/submit';

	let { data } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Bans</h1>

<Card.Root class="mb-6">
	<Card.Header><Card.Title>IP bans</Card.Title></Card.Header>
	<Card.Content class="space-y-3">
		<form method="POST" action="?/ipban" use:submit class="flex flex-wrap gap-2">
			<Input name="ip" required placeholder="IP, e.g. 1.2.3.4 or 1.2.*.*" class="w-56 font-mono" />
			<Input name="minutes" type="number" min={0} value={0} title="minutes, 0 = permanent" class="w-28" />
			<span class="self-center text-xs text-muted-foreground">min (0 = permanent)</span>
			<Button type="submit">Ban IP</Button>
		</form>
		{#if data.ips === null}
			<p class="text-sm text-destructive">Can't read bnban.conf.</p>
		{:else if !data.ips.length}
			<p class="text-sm text-muted-foreground">None.</p>
		{:else}
			<Table.Root>
				<Table.Header><Table.Row><Table.Head>IP / range</Table.Head><Table.Head>Until</Table.Head><Table.Head></Table.Head></Table.Row></Table.Header>
				<Table.Body>
					{#each data.ips as b (b.ip)}
						<Table.Row>
							<Table.Cell class="font-mono">{b.ip}</Table.Cell>
							<Table.Cell>{until(b.until)}</Table.Cell>
							<Table.Cell class="text-right">
								<form method="POST" action="?/ipunban" use:submit>
									<input type="hidden" name="ip" value={b.ip} /><Button type="submit" size="sm" variant="outline">Unban</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>

{#each [['lock', 'unlock', 'Locked accounts', 'Lock', 'Unlock', data.locked], ['mute', 'unmute', 'Muted accounts', 'Mute', 'Unmute', data.muted]] as const as [name, undo, title, verb, undoVerb, rows]}
	<Card.Root class="mb-6">
		<Card.Header><Card.Title>{title}</Card.Title></Card.Header>
		<Card.Content class="space-y-3">
			<form method="POST" action="?/{name}" use:submit class="flex flex-wrap gap-2">
				<Input name="user" required placeholder="Account" class="w-40" />
				<DurationReason />
				<Button type="submit">{verb}</Button>
			</form>
			{#if rows === null}
				<p class="text-sm text-destructive">Database unreachable.</p>
			{:else if !rows.length}
				<p class="text-sm text-muted-foreground">None.</p>
			{:else}
				<Table.Root>
					<Table.Header><Table.Row><Table.Head>Account</Table.Head><Table.Head>Until</Table.Head><Table.Head>Reason</Table.Head><Table.Head></Table.Head></Table.Row></Table.Header>
					<Table.Body>
						{#each rows as b (b.username)}
							<Table.Row>
								<Table.Cell>{b.username}</Table.Cell><Table.Cell>{until(b.until)}</Table.Cell><Table.Cell>{b.reason || '—'}</Table.Cell>
								<Table.Cell class="text-right">
									<form method="POST" action="?/{undo}" use:submit>
										<input type="hidden" name="user" value={b.username} /><Button type="submit" size="sm" variant="outline">{undoVerb}</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
{/each}
