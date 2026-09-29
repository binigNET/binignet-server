<script lang="ts">
	type F = { form?: string; ok?: boolean; message?: string } | null | undefined;
	let { form, name }: { form: F; name: string } = $props();
</script>

{#if form?.form === name && form.message}
	<pre class="mt-2 text-sm whitespace-pre-wrap {form.ok ? 'text-emerald-400' : 'text-red-400'}">{form.message}</pre>
{/if}
