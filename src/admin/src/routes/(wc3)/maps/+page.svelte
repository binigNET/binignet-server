<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { submit } from '$lib/submit';

	let { data } = $props();
	let editing = $state<string | null>(null);
	const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + ' MB';
</script>

<h1 class="mb-4 text-xl font-semibold">Maps <span class="text-sm font-normal text-muted-foreground">{data.maps.length} in aura/data/maps</span></h1>

<form method="POST" action="?/upload" enctype="multipart/form-data" use:submit class="mb-6 flex flex-wrap items-center gap-2">
	<Input type="file" name="file" accept=".w3x,.w3m" required class="w-auto" />
	<Button type="submit">Upload</Button>
	<span class="text-xs text-muted-foreground">.w3x / .w3m, max {mb(data.maxBytes)}</span>
</form>

<Table.Root>
	<Table.Header><Table.Row><Table.Head>File</Table.Head><Table.Head>Size</Table.Head><Table.Head>Added</Table.Head><Table.Head></Table.Head></Table.Row></Table.Header>
	<Table.Body>
		{#each data.maps as m (m.name)}
			<Table.Row>
				<Table.Cell class="whitespace-normal">
					{#if editing === m.name}
						<form method="POST" action="?/rename" use:submit={{ onResult: (r) => r.type === 'success' && (editing = null) }} class="flex gap-2">
							<input type="hidden" name="from" value={m.name} />
							<Input name="to" value={m.name} required class="h-7 flex-1" />
							<Button type="submit" size="sm">Save</Button>
							<Button size="sm" variant="outline" onclick={() => (editing = null)}>Cancel</Button>
						</form>
					{:else}
						{m.name}
					{/if}
				</Table.Cell>
				<Table.Cell>{mb(m.size)}</Table.Cell>
				<Table.Cell>{new Date(m.mtime).toLocaleDateString()}</Table.Cell>
				<Table.Cell>
					{#if editing !== m.name}
						<div class="flex justify-end gap-1">
							{#if !m.name.includes(',')}<Button href="/games?map={encodeURIComponent(m.name)}" size="sm" variant="outline">Host</Button>{/if}
							<Button size="sm" variant="outline" onclick={() => (editing = m.name)}>Rename</Button>
							<form method="POST" action="?/delete" use:submit={{ confirm: { title: `Delete ${m.name}?`, destructive: true } }}>
								<input type="hidden" name="name" value={m.name} /><Button type="submit" size="sm" variant="destructive">Delete</Button>
							</form>
						</div>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
