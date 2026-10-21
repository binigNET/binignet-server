import { error, redirect, type Handle } from '@sveltejs/kit';
import { actionOf, canAccess, home } from '$lib/access';
import { COOKIE, verifySession } from '$lib/server/auth';
import { config } from '$lib/server/env';
import { checkAccount } from '$lib/server/pvpgn/account-auth';

export const handle: Handle = async ({ event, resolve }) => {
	const { url, cookies, request } = event;
	let s = verifySession(cookies.get(COOKIE));
	// player sessions end on PLAYER_LOGIN=off, or when the account is locked/deleted or its password changes
	if (s?.role === 'player' && (!config.playerLogin() || (await checkAccount(s.name, s.fp)) === 'revoked')) {
		cookies.delete(COOKIE, { path: '/' });
		s = null;
	}
	event.locals.user = s && { name: s.name, role: s.role };
	if (!s) {
		if (url.pathname !== '/login') redirect(303, '/login');
		return resolve(event);
	}
	const action = actionOf(url);
	if (!canAccess(s.role, url.pathname, action)) {
		if (request.method === 'GET') redirect(303, home(s.role));
		error(403, 'Not allowed');
	}
	if (s.role === 'player' && request.method === 'POST') console.log('[player]', s.name, url.pathname, action);
	return resolve(event);
};
