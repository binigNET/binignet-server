import type { GameId } from '$lib/games';
import { config } from '../env';
import { queryInfo, type ServerInfo } from './a2s';
import { rcon } from './rcon';

/** A2S status + rcon health for one server; never throws. */
export async function serverStatus(game: GameId) {
	const { host, port } = config.hlds(game);
	let info: ServerInfo | null = null;
	let error = '';
	try {
		info = await queryInfo(host, port);
	} catch (e) {
		error = (e as Error).message;
	}
	const r = rcon(game);
	if (!config.hlds(game).password) r.state = 'nopass';
	return { info, error, rcon: { state: r.state, error: r.lastError } };
}

export type ServerStatus = Awaited<ReturnType<typeof serverStatus>>;
