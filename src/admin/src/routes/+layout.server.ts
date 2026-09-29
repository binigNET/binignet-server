import { health } from '$lib/server/health';

export const load = async ({ locals }) => ({
	authed: locals.authed,
	health: locals.authed ? await health() : null
});
