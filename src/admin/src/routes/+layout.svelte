<script lang="ts">
	import '../app.css';

	let { data, children } = $props();
</script>

<svelte:head><title>binignet admin</title></svelte:head>

{#if data.authed}
	<header class="flex items-center gap-6 border-b border-zinc-800 px-4 py-3">
		<a href="/" class="font-semibold">binignet admin</a>
		<nav class="flex gap-4 text-sm text-zinc-400">
			<a href="/" class="hover:text-zinc-100">Overview</a>
			<a href="/players" class="hover:text-zinc-100">Players</a>
			<a href="/games" class="hover:text-zinc-100">Games</a>
			<a href="/bans" class="hover:text-zinc-100">Bans</a>
			<a href="/messages" class="hover:text-zinc-100">Messages</a>
			<a href="/maps" class="hover:text-zinc-100">Maps</a>
			<a href="/banner" class="hover:text-zinc-100">Banner</a>
		</nav>
		<form method="POST" action="/logout" class="ml-auto">
			<button class="text-sm text-zinc-400 hover:text-zinc-100">Log out</button>
		</form>
	</header>
	{#if data.health && data.health.telnet.state !== 'ready'}
		<div class="bg-amber-900/60 px-4 py-2 text-sm text-amber-100">
			pvpgn offline ({data.health.telnet.error || data.health.telnet.state}) — actions disabled
		</div>
	{/if}
{/if}

<main class="mx-auto max-w-5xl p-4">
	{@render children()}
</main>
