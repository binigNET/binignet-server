// Promise-based confirm dialog, rendered once by ConfirmHost in the root layout.

export type Confirm = string | { title: string; body?: string; action?: string; destructive?: boolean };

type Pending = { title: string; body: string; action: string; destructive: boolean; resolve: (ok: boolean) => void };

export const dialog = $state<{ current: Pending | null }>({ current: null });

/** Ask the user; resolves false if dismissed. A newer ask cancels an open one. */
export function ask(c: Confirm): Promise<boolean> {
	const o = typeof c === 'string' ? { title: c } : c;
	dialog.current?.resolve(false);
	return new Promise((resolve) => {
		dialog.current = {
			title: o.title,
			body: o.body ?? '',
			action: o.action ?? 'Continue',
			destructive: o.destructive ?? false,
			resolve
		};
	});
}

/** Close the dialog with an answer. */
export function answer(ok: boolean) {
	dialog.current?.resolve(ok);
	dialog.current = null;
}
