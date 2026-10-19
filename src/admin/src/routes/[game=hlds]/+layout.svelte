<script lang="ts">
	import CircleX from '@lucide/svelte/icons/circle-x';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { page } from '$app/state';
	import * as Alert from '$lib/components/ui/alert';
	import { HLDS_GAMES } from '$lib/games';
	import { latest } from '$lib/latest.svelte';
	import NavTabs from '$lib/NavTabs.svelte';
	import { under } from '$lib/nav';
	import Updating from '$lib/Updating.svelte';

	let { data, children } = $props();

	const base = $derived(`/${data.game}`);
	const links = $derived(
		(
			[
				[base, 'Server'],
				[`${base}/bans`, 'Bans'],
				[`${base}/settings`, 'Settings'],
				[`${base}/console`, 'Console'],
				[`${base}/logs`, 'Logs']
			] as const
		).map(([href, label]) => ({
			href,
			label,
			active: href === base ? page.url.pathname === base : under(page.url.pathname, href)
		}))
	);
	const server = latest(() => data.server);
	const s = $derived(server.value);
</script>

<NavTabs {links} label={HLDS_GAMES[data.game].name}>
	{#snippet end()}<Updating show={server.pending && !!s} />{/snippet}
</NavTabs>
<!-- banners appear once the (streamed) status resolves -->
{#if s && !s.info}
	<Alert.Root variant="destructive" class="mb-4">
		<CircleX />
		<Alert.Title>Server offline</Alert.Title>
		<Alert.Description>{s.error}</Alert.Description>
	</Alert.Root>
{:else if s && s.rcon.state !== 'ok'}
	<Alert.Root variant="warning" class="mb-4">
		<TriangleAlert />
		{#if s.rcon.state === 'nopass'}
			<Alert.Title>rcon password not set — actions disabled</Alert.Title>
		{:else}
			<Alert.Title>rcon {s.rcon.state} — actions may fail</Alert.Title>
			<Alert.Description>{s.rcon.error}</Alert.Description>
		{/if}
	</Alert.Root>
{/if}

{@render children()}
