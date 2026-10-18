<script lang="ts">
	import LogView from '$lib/LogView.svelte';

	let { data } = $props();
</script>

{#key data.game}
	<LogView source={data.game} />
{/key}
