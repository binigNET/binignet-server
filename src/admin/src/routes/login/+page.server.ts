import { fail, redirect } from '@sveltejs/kit';
import { COOKIE, SESSION_TTL_S, checkPassword, isLimited, recordFail, signSession } from '$lib/server/auth';

export const load = ({ locals }) => {
	if (locals.authed) redirect(303, '/');
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		if (isLimited(ip)) return fail(429, { error: 'Too many attempts, try again later.' });
		const form = await request.formData();
		const user = String(form.get('username') ?? '');
		const pass = String(form.get('password') ?? '');
		if (user !== 'admin' || !checkPassword(pass)) {
			recordFail(ip);
			return fail(401, { error: 'Wrong username or password.' });
		}
		cookies.set(COOKIE, signSession(), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: SESSION_TTL_S
		});
		redirect(303, '/');
	}
};
