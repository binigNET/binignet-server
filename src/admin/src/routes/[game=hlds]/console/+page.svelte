<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { button, input } from '$lib/styles';

	let { data } = $props();

	// commands that take the server down or lock the dashboard out
	const DANGER = /^\s*(quit|exit|_restart|rcon_password)\b/im;

	type Entry = { cmd: string; out: string; ok: boolean };
	let history = $state<Entry[]>([]);
	let cmd = $state('');
	let busy = $state(false);
	let box: HTMLDivElement;
</script>

<h1 class="mb-1 text-xl font-semibold">Console</h1>
<p class="mb-3 text-sm text-zinc-400">Runs server console commands over rcon (e.g. <code>status</code>, <code>maps *</code>, <code>amx_plugins</code>). History is kept for this page only.</p>

<div bind:this={box} class="mb-3 h-[60vh] overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-xs leading-5">
	{#if !history.length}
		<p class="text-zinc-500">No commands yet.</p>
	{/if}
	{#each history as h}
		<div class="text-sky-400">] {h.cmd}</div>
		<pre class="mb-2 whitespace-pre-wrap break-all {h.ok ? '' : 'text-red-300'}">{h.out}</pre>
	{/each}
</div>

<form
	method="POST"
	use:enhance={({ cancel }) => {
		const sent = cmd.trim();
		if (!sent || (DANGER.test(sent) && !confirm(`"${sent}" can stop the server or lock out the dashboard. Run it?`))) return cancel();
		busy = true;
		return async ({ result }) => {
			const d = (result.type === 'success' || result.type === 'failure' ? result.data : null) as { ok?: boolean; message?: string } | null;
			history.push({ cmd: sent, out: d?.message ?? `error (${result.type})`, ok: !!d?.ok });
			cmd = '';
			busy = false;
			await tick();
			box.scrollTop = box.scrollHeight;
		};
	}}
	class="flex gap-2"
>
	<input name="cmd" bind:value={cmd} autocomplete="off" maxlength="500" placeholder="{data.game} console command" class="{input} flex-1 font-mono" />
	<button class={button} disabled={busy}>Run</button>
</form>
