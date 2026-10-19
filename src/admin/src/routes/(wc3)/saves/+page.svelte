<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { submit } from '$lib/submit';

	let { data } = $props();
	const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + ' MB';
	// WC3 1.26 player colors by index
	const COLORS = ['Red', 'Blue', 'Teal', 'Purple', 'Yellow', 'Orange', 'Green', 'Pink', 'Gray', 'Light Blue', 'Dark Green', 'Brown'];
</script>

<h1 class="mb-4 text-xl font-semibold">Saves <span class="text-sm font-normal text-muted-foreground">{data.saves.length} in aura/data/saves</span></h1>

<form method="POST" action="?/upload" enctype="multipart/form-data" use:submit class="mb-6 flex flex-wrap items-center gap-2">
	<Input type="file" name="file" accept=".w3z" required class="w-auto" />
	<Button type="submit">Upload</Button>
	<span class="text-xs text-muted-foreground">.w3z from a player's Warcraft III\save\Multiplayer, max {mb(data.maxBytes)}. Keep the original file name.</span>
</form>

<datalist id="accounts">{#each data.accounts as a}<option value={a}></option>{/each}</datalist>

<div class="space-y-4">
	{#each data.saves as s (s.name)}
		<Card.Root class="max-w-3xl">
			<Card.Header>
				<Card.Title>{s.name}</Card.Title>
				<Card.Description>{mb(s.size)} · {new Date(s.mtime).toLocaleDateString()}</Card.Description>
				<Card.Action>
					<form method="POST" action="?/delete" use:submit={{ confirm: { title: `Delete ${s.name}?`, destructive: true } }}>
						<input type="hidden" name="name" value={s.name} /><Button type="submit" size="sm" variant="destructive">Delete</Button>
					</form>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{#if !s.info}
					<p class="text-sm text-destructive">Unreadable save: {s.error}</p>
				{:else}
					<p class="mb-3 text-sm text-muted-foreground">
						Map <span class="font-mono">{s.info.mapFile}</span>
						{#if !s.map}— <span class="text-warning">not uploaded</span>, add it on the <a href="/maps" class="underline">Maps</a> page first{/if}
					</p>
					<form method="POST" action="?/host" use:submit={{ reset: false }} class="space-y-2">
						<input type="hidden" name="save" value={s.name} />
						<Input name="name" maxlength={30} value={s.info.gameName.slice(0, 30)} placeholder="Game name" class="w-64" />
						<Table.Root class="w-auto">
							<Table.Header><Table.Row><Table.Head>Slot</Table.Head><Table.Head>Team</Table.Head><Table.Head>Race</Table.Head><Table.Head>Player</Table.Head></Table.Row></Table.Header>
							<Table.Body>
								{#each s.info.slots.filter((x) => x.human) as slot}
									<Table.Row>
										<Table.Cell>{COLORS[slot.color] ?? `#${slot.color + 1}`}</Table.Cell>
										<Table.Cell>{slot.team + 1}</Table.Cell>
										<Table.Cell>{slot.race}</Table.Cell>
										<Table.Cell><Input name="player" list="accounts" required maxlength={15} class="h-7 w-48" /></Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
						<Button type="submit" disabled={!s.map} loadingText="Hosting… (loading map)">Load</Button>
						<p class="text-xs text-muted-foreground">Players must still have this save in their own Save\Multiplayer folder. Lobby auto-starts once all join; the save is deleted here after hosting.</p>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<p class="text-sm text-muted-foreground">No saves uploaded.</p>
	{/each}
</div>
