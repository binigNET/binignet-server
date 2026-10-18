<script lang="ts">
	import { page } from '$app/state';
	import { WC3_LINKS, under } from '$lib/nav';

	let { data, children } = $props();
</script>

<nav class="mb-4 flex gap-4 border-b border-zinc-800 pb-2 text-sm">
	{#each WC3_LINKS as [href, label]}
		<a {href} class={under(page.url.pathname, href) ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'}>{label}</a>
	{/each}
</nav>
{#if data.health && data.health.telnet.state !== 'ready'}
	<div class="mb-4 rounded bg-amber-900/60 px-4 py-2 text-sm text-amber-100">
		pvpgn offline ({data.health.telnet.error || data.health.telnet.state}) — actions disabled
	</div>
{/if}

{@render children()}
