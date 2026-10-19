<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { submit } from '$lib/submit';

	let { data } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Messages</h1>

<div class="grid gap-4 md:grid-cols-2">
	<Card.Root>
		<Card.Header><Card.Title>Announce</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/announce" use:submit class="flex gap-2">
				<Input name="message" required maxlength={150} placeholder="Message to everyone" class="flex-1" />
				<Button type="submit">Send</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title>Whisper</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/whisper" use:submit class="flex gap-2">
				<Input name="user" required placeholder="Player" class="w-32" />
				<Input name="message" required maxlength={130} placeholder="Message" class="flex-1" />
				<Button type="submit">Send</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="md:col-span-2">
		<Card.Header>
			<Card.Title>Alert</Card.Title>
			<Card.Description>Pop-up box to everyone online</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/alert" use:submit class="flex items-start gap-2">
				<Textarea name="message" required rows={2} maxlength={150} placeholder="Message (new lines allowed)" class="flex-1" />
				<Button type="submit">Send</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#each [['motd', 'MOTD', data.motd, 'Codes: %E error/%I info line, %l user, %s server, %U/%G users/games in client, %a accounts. Reloaded with /rehash i18n.'], ['news', 'News', data.news, 'Blocks start with {MM/DD/YYYY}. WC3 caches news client-side. Reloaded with /rehash news.']] as const as [name, title, text, hint]}
		<Card.Root class="md:col-span-2">
			<Card.Header>
				<Card.Title>{title}</Card.Title>
				<Card.Description>{hint}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/{name}" use:submit={{ reset: false }}>
					<Textarea name="text" rows={12} class="w-full font-mono" value={text} />
					<Button type="submit" class="mt-2">Save & reload</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
