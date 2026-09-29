<script lang="ts">
	let { form } = $props();
</script>

<form method="POST" class="mx-auto mt-24 flex max-w-xs flex-col gap-3">
	<h1 class="text-xl font-semibold">binignet admin</h1>
	<input name="username" placeholder="Username" autocomplete="username" required
		class="rounded border border-zinc-700 bg-zinc-900 px-3 py-2" />
	<input name="password" type="password" placeholder="Password" autocomplete="current-password" required
		class="rounded border border-zinc-700 bg-zinc-900 px-3 py-2" />
	{#if form?.error}<p class="text-sm text-red-400">{form.error}</p>{/if}
	<button class="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-900 hover:bg-white">Log in</button>
</form>
