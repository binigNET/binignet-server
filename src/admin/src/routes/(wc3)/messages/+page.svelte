<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/Flash.svelte';
	import { button, input } from '$lib/styles';

	let { data, form } = $props();
</script>

<h1 class="mb-6 text-xl font-semibold">Messages</h1>

<div class="grid gap-8 md:grid-cols-2">
	<section>
		<h2 class="mb-2 font-medium">Announce</h2>
		<form method="POST" action="?/announce" use:enhance class="flex gap-2">
			<input name="message" required maxlength="150" placeholder="Message to everyone" class="{input} flex-1" />
			<button class={button}>Send</button>
		</form>
		<Flash {form} name="announce" />
	</section>

	<section>
		<h2 class="mb-2 font-medium">Whisper</h2>
		<form method="POST" action="?/whisper" use:enhance class="flex gap-2">
			<input name="user" required placeholder="Player" class="{input} w-32" />
			<input name="message" required maxlength="130" placeholder="Message" class="{input} flex-1" />
			<button class={button}>Send</button>
		</form>
		<Flash {form} name="whisper" />
	</section>

	<section class="md:col-span-2">
		<h2 class="mb-2 font-medium">Alert <span class="text-sm font-normal text-zinc-400">(pop-up box to everyone online)</span></h2>
		<form method="POST" action="?/alert" use:enhance class="flex gap-2">
			<textarea name="message" required rows="2" maxlength="150" placeholder="Message (new lines allowed)" class="{input} flex-1"></textarea>
			<button class={button}>Send</button>
		</form>
		<Flash {form} name="alert" />
	</section>

	{#each [['motd', 'MOTD', data.motd, 'Codes: %E error/%I info line, %l user, %s server, %U/%G users/games in client, %a accounts. Reloaded with /rehash i18n.'], ['news', 'News', data.news, 'Blocks start with {MM/DD/YYYY}. WC3 caches news client-side. Reloaded with /rehash news.']] as const as [name, title, text, hint]}
		<section class="md:col-span-2">
			<h2 class="mb-1 font-medium">{title}</h2>
			<p class="mb-2 text-xs text-zinc-400">{hint}</p>
			<form method="POST" action="?/{name}" use:enhance={() => ({ update }) => update({ reset: false })}>
				<textarea name="text" rows="12" class="{input} w-full font-mono">{text}</textarea>
				<button class="{button} mt-2">Save & reload</button>
			</form>
			<Flash {form} {name} />
		</section>
	{/each}
</div>
