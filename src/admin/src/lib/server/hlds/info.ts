import type { GameId } from '$lib/games';
import { config } from '../env';
import { queryInfo, type ServerInfo } from './a2s';
import { parseStatus, parseStatusHeader, type Player } from './parse';
import { rcon } from './rcon';

// Pages, layouts and the overview all ask for this at once (and again on every
// auto-refresh), so share one result briefly: the servers drop queries past a
// few per second from one IP.
const TTL_MS = 2000;
const cache = new Map<GameId, { at: number; p: Promise<Status> }>();

type Status = {
	info: ServerInfo | null;
	/** humans only; null when rcon is unavailable (A2S has no player details) */
	players: Player[] | null;
	bots: number;
	source: 'rcon' | 'a2s' | null;
	error: string;
	rcon: { state: string; error: string };
};

async function load(game: GameId): Promise<Status> {
	const { host, port, password } = config.hlds(game);
	const r = rcon(game);
	let rconError = '';
	if (password) {
		// one `status` gives map, counts and the player list
		try {
			const out = await r.run('status');
			const head = parseStatusHeader(out);
			if (head) {
				const all = parseStatus(out);
				const bots = all.filter((p) => p.bot).length;
				return {
					info: { ...head, bots },
					players: all.filter((p) => !p.bot),
					bots,
					source: 'rcon',
					error: '',
					rcon: { state: r.state, error: r.lastError }
				};
			}
			rconError = 'unexpected status reply';
		} catch (e) {
			rconError = (e as Error).message;
		}
	} else r.state = 'nopass';
	let info: ServerInfo | null = null;
	let error = '';
	try {
		info = await queryInfo(host, port);
	} catch (e) {
		error = (e as Error).message;
	}
	return {
		info,
		players: null,
		bots: info?.bots ?? 0,
		source: info ? 'a2s' : null,
		error: error && rconError ? `${error}; rcon: ${rconError}` : error,
		rcon: { state: r.state, error: r.lastError || rconError }
	};
}

/** Server info via rcon `status`, falling back to an A2S query; never throws. */
export function serverStatus(game: GameId): Promise<Status> {
	const hit = cache.get(game);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.p;
	const p = load(game);
	cache.set(game, { at: Date.now(), p });
	return p;
}

/** Drop the cached status (after an action changed the server). */
export const invalidateStatus = (game: GameId) => cache.delete(game);

export type ServerStatus = Status;
