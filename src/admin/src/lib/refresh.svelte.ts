import { invalidateAll } from '$app/navigation';

/** Re-run page loads every `ms` while the component is mounted (and `enabled()` holds). */
export function autoRefresh(ms = 15_000, enabled: () => boolean = () => true) {
	$effect(() => {
		const t = setInterval(() => enabled() && invalidateAll(), ms);
		return () => clearInterval(t);
	});
}
