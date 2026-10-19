<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { submit } from '$lib/submit';

	let { data } = $props();
</script>

<h1 class="mb-1 text-xl font-semibold">Banner</h1>
<p class="mb-4 text-sm text-muted-foreground">
	Ad banner shown in the WC3 client (W3XP slot of ad.json). PNG, max {data.maxBytes / 1024} KB. Size in the 1.26 client still to be confirmed.
</p>

<Card.Root class="md:max-w-lg">
	<Card.Content class="space-y-4">
		{#if data.banner}
			<div>
				<img src="/banner/image?name={encodeURIComponent(data.banner.filename)}" alt="current banner" class="max-w-full rounded-md border"
					onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
				<p class="mt-1 font-mono text-xs text-muted-foreground">{data.banner.filename} → {data.banner.url}</p>
			</div>
		{/if}
		<form method="POST" enctype="multipart/form-data" use:submit={{ reset: false }} class="flex flex-col gap-2">
			<Input type="file" name="file" accept="image/png" />
			<Input name="url" required value={data.banner?.url ?? 'https://'} placeholder="Click-through URL" />
			<Button type="submit" class="self-start">Save</Button>
		</form>
	</Card.Content>
</Card.Root>
