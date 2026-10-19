<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import * as Table from '$lib/components/ui/table';
	import { submit } from '$lib/submit';

	let { data } = $props();
</script>

<h1 class="mb-1 text-xl font-semibold">Settings</h1>
<p class="mb-4 text-sm text-muted-foreground">
	Apply changes the running server until the next restart or map change. Save as default also writes the server config.
</p>
{#if data.error}
	<p class="mb-3 text-sm text-warning">{data.error}</p>
{/if}
<Table.Root class="max-w-3xl">
	<Table.Header>
		<Table.Row><Table.Head>Setting</Table.Head><Table.Head>Live</Table.Head><Table.Head>Saved</Table.Head><Table.Head></Table.Head></Table.Row>
	</Table.Header>
	<Table.Body>
		{#each data.cvars as c (c.name)}
			<Table.Row>
				<Table.Cell>{c.label} <span class="font-mono text-xs text-muted-foreground">{c.name}</span></Table.Cell>
				<Table.Cell class="font-mono text-xs">{c.live ?? '—'}</Table.Cell>
				<Table.Cell class="font-mono text-xs text-muted-foreground">{c.saved ?? '—'}</Table.Cell>
				<Table.Cell>
					<form method="POST" use:submit={{ reset: false }} class="flex justify-end gap-1">
						<input type="hidden" name="name" value={c.name} />
						{#if c.type === 'bool'}
							<NativeSelect.Root name="value" size="sm" class="w-20">
								<NativeSelect.Option value="1" selected={c.live === '1'}>on</NativeSelect.Option>
								<NativeSelect.Option value="0" selected={c.live !== '1'}>off</NativeSelect.Option>
							</NativeSelect.Root>
						{:else if c.type === 'text'}
							<Input name="value" value={c.live ?? ''} maxlength={32} placeholder="(empty)" class="h-7 w-32" />
						{:else}
							<Input
								name="value"
								type="number"
								min={c.type.min}
								max={c.type.max}
								step={c.type.float ? 0.25 : 1}
								value={c.live ?? ''}
								required
								class="h-7 w-24"
							/>
						{/if}
						<Button type="submit" formaction="?/apply" size="sm" variant="outline">Apply</Button>
						<Button type="submit" formaction="?/save" size="sm" variant="outline">Save as default</Button>
					</form>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
