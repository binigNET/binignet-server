<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner';

	// "updating…" hint while a streamed value refreshes
	let { show }: { show: boolean } = $props();
</script>

{#if show}
	<span class="flex items-center gap-1 text-xs text-muted-foreground"><Spinner class="size-3" /> updating…</span>
{/if}
