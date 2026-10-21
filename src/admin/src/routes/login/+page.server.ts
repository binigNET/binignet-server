import { fail, redirect } from '@sveltejs/kit';
import { home, type Role } from '$lib/access';
import { COOKIE, SESSION_TTL_S, checkPassword, isLimited, recordFail, signSession, type Session } from '$lib/server/auth';
import { config } from '$lib/server/env';
import { verifyAccount } from '$lib/server/pvpgn/account-auth';

export const load = ({ locals }) => {
	if (locals.user) redirect(303, home(locals.user.role));
};

// 'admin' is the dashboard admin; any other name is a pvpgn account (player)
async function login(user: string, pass: string): Promise<Session | null> {
	if (user === 'admin') return checkPassword(pass) ? { role: 'admin', name: 'admin', fp: '-' } : null;
	if (!config.playerLogin()) return null;
	const acct = await verifyAccount(user, pass);
	return acct && { role: 'player' as Role, ...acct };
}

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const form = await request.formData();
		const user = String(form.get('username') ?? '').trim();
		const pass = String(form.get('password') ?? '');
		if (isLimited(ip, user)) return fail(429, { error: 'Too many attempts, try again later.' });
		let s: Session | null;
		try {
			s = await login(user, pass);
		} catch {
			return fail(503, { error: 'Account database unavailable, try again later.' });
		}
		if (!s) {
			recordFail(ip, user);
			return fail(401, { error: 'Wrong username or password.' });
		}
		cookies.set(COOKIE, signSession(s), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: SESSION_TTL_S
		});
		redirect(303, home(s.role));
	}
};
