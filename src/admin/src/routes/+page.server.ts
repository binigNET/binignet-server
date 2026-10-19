import { GAME_IDS } from '$lib/games';
import { serverStatus } from '$lib/server/hlds/info';

// streamed: rcon/A2S can take seconds when a server is down
export const load = async () => ({
	servers: Promise.all(GAME_IDS.map(async (game) => ({ game, ...(await serverStatus(game)) })))
});
