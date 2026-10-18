import { serverStatus } from '$lib/server/hlds/info';

export const load = async ({ params }) => ({ game: params.game, server: await serverStatus(params.game) });
