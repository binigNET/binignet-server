import { invalidateAll } from '$app/navigation';

/** Re-run page loads every `ms` while the component is mounted. */
export function autoRefresh(ms = 15_000) {
	$effect(() => {
		const t = setInterval(() => invalidateAll(), ms);
		return () => clearInterval(t);
	});
}
