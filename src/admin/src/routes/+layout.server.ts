import { health } from '$lib/server/health';

export const load = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { user, health: null };
	const h = await health();
	// players only need the telnet state (WC3 "offline" banner); error strings can name internal hosts
	return { user, health: user.role === 'admin' ? h : { ...h, telnet: { state: h.telnet.state, error: '' } } };
};
