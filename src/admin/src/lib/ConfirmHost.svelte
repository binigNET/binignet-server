<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { answer, dialog } from '$lib/confirm.svelte';

	const c = $derived(dialog.current);
</script>

<AlertDialog.Root open={!!c} onOpenChange={(open) => !open && answer(false)}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{c?.title}</AlertDialog.Title>
			{#if c?.body}
				<AlertDialog.Description class="whitespace-pre-wrap">{c.body}</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => answer(false)}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action variant={c?.destructive ? 'destructive' : 'default'} onclick={() => answer(true)}>
				{c?.action}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
