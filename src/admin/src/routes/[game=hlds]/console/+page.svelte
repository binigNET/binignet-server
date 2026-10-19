<script lang="ts">
	import { tick } from 'svelte';
	import { submit } from '$lib/submit';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();

	// commands that take the server down or lock the dashboard out
	const DANGER = /^\s*(quit|exit|_restart|rcon_password)\b/im;

	type Entry = { cmd: string; out: string; ok: boolean };
	let history = $state<Entry[]>([]);
	let cmd = $state('');
	let box: HTMLDivElement;
</script>

<h1 class="mb-1 text-xl font-semibold">Console</h1>
<p class="mb-3 text-sm text-muted-foreground">Runs server console commands over rcon (e.g. <code>status</code>, <code>maps *</code>, <code>amx_plugins</code>). History is kept for this page only.</p>

<div bind:this={box} class="mb-3 h-[60vh] overflow-auto rounded-lg border bg-muted/40 p-2 font-mono text-xs leading-5">
	{#if !history.length}
		<p class="text-muted-foreground">No commands yet.</p>
	{/if}
	{#each history as h}
		<div class="text-primary">] {h.cmd}</div>
		<pre class="mb-2 whitespace-pre-wrap break-all {h.ok ? '' : 'text-destructive'}">{h.out}</pre>
	{/each}
</div>

<form
	method="POST"
	use:submit={{
		toast: 'errors',
		confirm: (fd) => {
			const sent = String(fd.get('cmd') ?? '').trim();
			return DANGER.test(sent) ? { title: `Run "${sent}"?`, body: 'It can stop the server or lock out the dashboard.', destructive: true } : null;
		},
		onResult: (result, fd) => {
			const d = (result.type === 'success' || result.type === 'failure' ? result.data : null) as { ok?: boolean; message?: string } | null;
			history.push({ cmd: String(fd.get('cmd') ?? '').trim(), out: d?.message ?? `error (${result.type})`, ok: !!d?.ok });
			cmd = '';
			tick().then(() => (box.scrollTop = box.scrollHeight));
		}
	}}
	class="flex gap-2"
>
	<Input name="cmd" bind:value={cmd} autocomplete="off" required maxlength={500} placeholder="{data.game} console command" class="flex-1 font-mono" />
	<Button type="submit">Run</Button>
</form>
