import { serverStatus } from '$lib/server/hlds/info';

// `server` is streamed (not awaited) so navigation doesn't wait on rcon
export const load = async ({ params, locals }) => {
	const server = serverStatus(params.game);
	// players see counts only, not names/IPs/steam IDs
	return { game: params.game, server: locals.user?.role === 'admin' ? server : server.then((s) => ({ ...s, players: null })) };
};
