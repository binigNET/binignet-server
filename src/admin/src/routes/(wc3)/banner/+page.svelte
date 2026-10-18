<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { button, input } from '$lib/styles';

	let { data, form } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Banner</h1>
<p class="mb-4 text-sm text-zinc-400">
	Ad banner shown in the WC3 client (W3XP slot of ad.json). PNG, max {data.maxBytes / 1024} KB. Size in the 1.26 client still to be confirmed.
</p>

{#if data.banner}
	<div class="mb-4">
		<img src="/banner/image?name={encodeURIComponent(data.banner.filename)}" alt="current banner" class="max-w-full border border-zinc-800"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
		<p class="mt-1 text-xs text-zinc-400">{data.banner.filename} → {data.banner.url}</p>
	</div>
{/if}

<form method="POST" enctype="multipart/form-data" use:enhance={() => ({ update }) => update({ reset: false })} class="flex flex-col gap-2 md:max-w-lg">
	<input type="file" name="file" accept="image/png" class="text-sm" />
	<input name="url" required value={data.banner?.url ?? 'https://'} placeholder="Click-through URL" class={input} />
	<button class="{button} self-start">Save</button>
</form>
<Flash {form} name="banner" />
