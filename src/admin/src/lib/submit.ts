// `use:submit`: SvelteKit `enhance` plus confirm dialog, pending state and result toasts.
// While a request is in flight the clicked button gets aria-busy (Button shows a spinner),
// the form gets data-pending and its submit buttons are disabled.
import { enhance } from '$app/forms';
import type { ActionResult } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';
import { ask, type Confirm } from './confirm.svelte';

export type SubmitOpts = {
	/** ask first; a function can build the prompt from the form data (null = don't ask) */
	confirm?: Confirm | ((data: FormData) => Confirm | null);
	/** reset the form after success (default true) */
	reset?: boolean;
	/** which results to toast (default 'all') */
	toast?: 'all' | 'errors' | false;
	onResult?: (result: ActionResult, data: FormData) => void;
};

/** `{ ok, message }` action data → toast. First line is the title, the rest a monospace description. */
export function toastResult(result: ActionResult, which: SubmitOpts['toast'] = 'all') {
	if (!which) return;
	let ok: boolean;
	let message: string;
	if (result.type === 'error') {
		ok = false;
		message = result.error?.message ?? 'Request failed';
	} else if (result.type === 'success' || result.type === 'failure') {
		const data = result.data as { ok?: boolean; message?: string } | undefined;
		if (!data?.message) return;
		ok = result.type === 'success' && data.ok !== false;
		message = data.message;
	} else return;
	if (ok && which === 'errors') return;
	const [title, ...rest] = message.trim().split('\n');
	const opts = { description: rest.join('\n').trim() || undefined, descriptionClass: 'font-mono whitespace-pre-wrap text-xs' };
	if (ok) toast.success(title, { ...opts, duration: 4000 });
	else toast.error(title, { ...opts, duration: Infinity, closeButton: true });
}

export function submit(form: HTMLFormElement, opts: SubmitOpts = {}) {
	let o = opts;
	const buttons = () => [...form.querySelectorAll<HTMLButtonElement>('button:not([type=button])')];

	const { destroy } = enhance(form, async ({ formData, submitter, cancel }) => {
		const c = typeof o.confirm === 'function' ? o.confirm(formData) : o.confirm;
		if (c && !(await ask(c))) return cancel();

		// remember which buttons were already disabled so we don't re-enable them
		const was = new Map(buttons().map((b) => [b, b.disabled]));
		form.dataset.pending = '';
		submitter?.setAttribute('aria-busy', 'true');
		for (const b of was.keys()) b.disabled = true;

		return async ({ result, update }) => {
			try {
				toastResult(result, o.toast ?? 'all');
				o.onResult?.(result, formData);
				await update({ reset: o.reset ?? true });
			} finally {
				delete form.dataset.pending;
				submitter?.removeAttribute('aria-busy');
				for (const [b, d] of was) if (b.isConnected) b.disabled = d;
			}
		};
	});

	return {
		update(next: SubmitOpts = {}) {
			o = next;
		},
		destroy
	};
}
