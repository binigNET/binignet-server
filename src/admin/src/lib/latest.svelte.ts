// Streamed load data (un-awaited promises) → reactive value that survives refreshes:
// `value` is undefined until the first resolve (show a skeleton), then keeps the last
// result while a newer promise is pending (`pending` → "updating…").

export function latest<T>(get: () => Promise<T> | T) {
	let value = $state.raw<T | undefined>();
	let pending = $state(true);
	let seq = 0;

	$effect(() => {
		const p = get();
		const n = ++seq;
		pending = true;
		Promise.resolve(p).then(
			(v) => {
				if (n !== seq) return;
				value = v;
				pending = false;
			},
			() => {
				if (n === seq) pending = false;
			}
		);
	});

	return {
		get value() {
			return value;
		},
		get pending() {
			return pending;
		}
	};
}
