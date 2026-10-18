import { GAME_IDS } from '$lib/games';
import { serverStatus } from '$lib/server/hlds/info';

export const load = async () => ({
	servers: await Promise.all(GAME_IDS.map(async (game) => ({ game, ...(await serverStatus(game)) })))
});
