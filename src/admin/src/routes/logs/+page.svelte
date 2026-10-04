<script lang="ts">
	import { tick } from 'svelte';
	import { small } from '$lib/styles';

	type Line = { ts: string; s: 'out' | 'err'; t: string };
	const MAX = 2000;

	let lines = $state.raw<Line[]>([]);
	let conn = $state<'connecting' | 'live' | 'down' | 'reconnecting'>('connecting');
	let error = $state('');
	let paused = $state(false);
	let held = $state(0);
	let box: HTMLDivElement;
	let stick = true;

	// incoming lines are batched per frame; held while paused
	let pending: Line[] = [];
	let frame = 0;

	function flush() {
		frame = 0;
		if (paused || !pending.length) return;
		const prev = lines.at(-1);
		const fresh = pending.filter((l, i) => {
			const before = i ? pending[i - 1] : prev;
			// docker's `since` is inclusive: drop an exact repeat of the previous line
			return !(before && before.ts === l.ts && before.t === l.t);
		});
		pending = [];
		held = 0;
		lines = [...lines, ...fresh].slice(-MAX);
		if (stick) tick().then(() => box && (box.scrollTop = box.scrollHeight));
	}

	function queue(l: Line) {
		pending.push(l);
		if (paused) held = pending.length;
		else frame ||= requestAnimationFrame(flush);
	}

	$effect(() => {
		const es = new EventSource('/logs/stream');
		es.onmessage = (e) => queue(JSON.parse(e.data));
		es.addEventListener('status', (e) => {
			const s = JSON.parse((e as MessageEvent).data);
			conn = s.state;
			error = s.error;
		});
		es.onerror = () => (conn = 'reconnecting');
		return () => {
			es.close();
			cancelAnimationFrame(frame);
		};
	});

	function onScroll() {
		stick = box.scrollTop + box.clientHeight >= box.scrollHeight - 24;
	}

	function togglePause() {
		paused = !paused;
		if (!paused) flush();
	}

	const pad = (n: number) => String(n).padStart(2, '0');
	function local(ts: string) {
		const d = new Date(ts);
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	}

	function download() {
		const text = lines.map((l) => `${local(l.ts)}  ${l.t}`).join('\n') + '\n';
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
		a.download = `aura-${local(new Date().toISOString()).slice(0, 10)}.log`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	const chip = $derived(
		conn === 'live'
			? ['live', 'text-emerald-400']
			: conn === 'down'
				? [`aura not running — retrying${error ? ` (${error})` : ''}`, 'text-amber-400']
				: [conn === 'connecting' ? 'connecting…' : 'reconnecting…', 'text-zinc-400']
	);
</script>

<div class="mb-3 flex flex-wrap items-center gap-3">
	<h1 class="text-xl font-semibold">aura logs</h1>
	<span class="text-sm {chip[1]}">● {chip[0]}</span>
	<div class="ml-auto flex gap-2">
		<button class={small} onclick={togglePause}>{paused ? `Resume${held ? ` (${held} new)` : ''}` : 'Pause'}</button>
		<button class={small} onclick={() => (lines = [])}>Clear</button>
		<button class={small} onclick={download} disabled={!lines.length}>Download</button>
	</div>
</div>

<div bind:this={box} onscroll={onScroll} class="h-[75vh] overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-xs leading-5">
	{#if !lines.length}
		<p class="text-zinc-500">No log lines yet.</p>
	{/if}
	{#each lines as l}
		<div class="whitespace-pre-wrap break-all {l.s === 'err' ? 'text-red-300' : ''}">
			<span class="text-zinc-500 select-none">{local(l.ts)}</span>  {l.t}
		</div>
	{/each}
</div>
