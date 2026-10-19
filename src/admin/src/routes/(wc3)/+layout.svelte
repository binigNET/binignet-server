<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { page } from '$app/state';
	import * as Alert from '$lib/components/ui/alert';
	import NavTabs from '$lib/NavTabs.svelte';
	import { WC3_LINKS, under } from '$lib/nav';

	let { data, children } = $props();

	const links = $derived(WC3_LINKS.map(([href, label]) => ({ href, label, active: under(page.url.pathname, href) })));
</script>

<NavTabs {links} />
{#if data.health && data.health.telnet.state !== 'ready'}
	<Alert.Root variant="warning" class="mb-4">
		<TriangleAlert />
		<Alert.Title>pvpgn offline — actions disabled</Alert.Title>
		<Alert.Description>{data.health.telnet.error || data.health.telnet.state}</Alert.Description>
	</Alert.Root>
{/if}

{@render children()}
