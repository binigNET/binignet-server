import { serverStatus } from '$lib/server/hlds/info';

// `server` is streamed (not awaited) so navigation doesn't wait on rcon
export const load = async ({ params }) => ({ game: params.game, server: serverStatus(params.game) });
