import { redirect, type Handle } from '@sveltejs/kit';
import { COOKIE, verifySession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.authed = verifySession(event.cookies.get(COOKIE));
	if (!event.locals.authed && event.url.pathname !== '/login') {
		redirect(303, '/login');
	}
	return resolve(event);
};
