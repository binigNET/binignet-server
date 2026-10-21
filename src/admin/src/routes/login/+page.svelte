<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();
</script>

<Card.Root class="mx-auto mt-24 max-w-xs">
	<Card.Header>
		<Card.Title class="text-xl text-primary">binignet admin</Card.Title>
	</Card.Header>
	<Card.Content>
		<form method="POST" class="flex flex-col gap-3">
			<div class="grid gap-1.5">
				<Label for="username">Username</Label>
				<Input id="username" name="username" autocomplete="username" placeholder="Battle.net account" required />
			</div>
			<div class="grid gap-1.5">
				<Label for="password">Password</Label>
				<Input id="password" name="password" type="password" autocomplete="current-password" required />
			</div>
			{#if form?.error}<p class="text-sm text-destructive">{form.error}</p>{/if}
			<Button type="submit">Log in</Button>
		</form>
	</Card.Content>
</Card.Root>
