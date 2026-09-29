import { fail } from '@sveltejs/kit';
import type { Result } from './pvpgn/commands';

/** Wrap a command result as action data, tagged with the form it came from. */
export function respond(form: string, r: Result) {
	return r.ok ? { form, ok: true, message: r.message } : fail(400, { form, ok: false, message: r.message });
}

export async function fields(request: Request) {
	const data = await request.formData();
	const str = (k: string) => String(data.get(k) ?? '').trim();
	const num = (k: string) => Number(data.get(k) ?? 0) || 0;
	return { str, num, raw: (k: string) => String(data.get(k) ?? '') };
}
