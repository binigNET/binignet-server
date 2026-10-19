<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { submit } from '$lib/submit';

	let { data } = $props();

	const lists = $derived([
		['Steam IDs', data.ids],
		['IPs', data.ips]
	] as const);
</script>

<h1 class="mb-4 text-xl font-semibold">Bans</h1>
{#if data.error}
	<p class="text-sm text-warning">{data.error}</p>
{:else}
	{#each lists as [title, list]}
		<h2 class="mt-4 mb-2 font-medium">{title} <span class="text-sm font-normal text-muted-foreground">({list.length})</span></h2>
		{#if !list.length}
			<p class="text-sm text-muted-foreground">None.</p>
		{:else}
			<Table.Root class="max-w-xl">
				<Table.Body>
					{#each list as b (b.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs">{b.id}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{b.expires}</Table.Cell>
							<Table.Cell class="text-right">
								<form method="POST" action="?/unban" use:submit>
									<input type="hidden" name="id" value={b.id} />
									<Button type="submit" size="sm" variant="outline">Unban</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	{/each}
{/if}
