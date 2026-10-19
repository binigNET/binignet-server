<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as NativeSelect from '$lib/components/ui/native-select';

	// pvpgn /lock and /mute take hours; 0 = permanent
	const DURATIONS = [
		[1, '1 hour'],
		[24, '1 day'],
		[168, '7 days'],
		[0, 'Permanent']
	] as const;
</script>

<NativeSelect.Root name="hours" class="w-32">
	{#each DURATIONS as [h, label]}<NativeSelect.Option value={h} selected={h === 24}>{label}</NativeSelect.Option>{/each}
</NativeSelect.Root>
<Input name="reason" placeholder="Reason" class="w-auto min-w-40 flex-1" />
