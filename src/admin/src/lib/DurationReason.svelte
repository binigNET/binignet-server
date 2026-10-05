<script lang="ts">
	import { input } from '$lib/styles';

	// pvpgn /lock and /mute take hours; 0 = permanent
	const DURATIONS = [
		[1, '1 hour'],
		[24, '1 day'],
		[168, '7 days'],
		[0, 'Permanent']
	] as const;
</script>

<select name="hours" class="{input} w-32">
	{#each DURATIONS as [h, label]}<option value={h} selected={h === 24}>{label}</option>{/each}
</select>
<input name="reason" placeholder="Reason" class="{input} min-w-40 flex-1" />
