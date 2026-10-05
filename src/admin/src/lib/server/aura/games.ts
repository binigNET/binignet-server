// aura's view of its games via whispered "!games" (see SPIKE.md).
// Item format: `Lobby#1: [Map Title] "name" - owner - 3/12 : 4min` (Game#N once started).
import { readdir } from 'node:fs/promises';
import { validName } from '../pvpgn/commands';
import { MAX_CMD_LEN, pvpgn } from '../pvpgn/telnet';
import { config } from '../env';
import { listMaps, mapcfgsDir } from './files';

export type AuraGame = {
	id: number;
	lobby: boolean;
	map: string;
	name: string;
	owner: string;
	players: number;
	slots: number;
	minutes: number;
};

const ITEM_RE = /(Lobby|Game)#(\d+): \[(.*?)\] "(.*?)" - (.*?) - (\d+)\/(\d+) : (\d+)min/g;
const TTL_MS = 15_000;

let cache: { at: number; games: AuraGame[] } | null = null;
let inflight: Promise<AuraGame[]> | null = null;

export function parseAuraGames(lines: string[]): AuraGame[] {
	const text = lines.join(' ');
	return [...text.matchAll(ITEM_RE)].map((m) => ({
		id: Number(m[2]),
		lobby: m[1] === 'Lobby',
		map: m[3],
		name: m[4],
		owner: m[5],
		players: Number(m[6]),
		slots: Number(m[7]),
		minutes: Number(m[8])
	}));
}

/** Cached ~15s (`fresh` skips the cache); one whisper in flight at a time. Throws if pvpgn/aura unreachable. */
export async function auraGames({ fresh = false } = {}): Promise<AuraGame[]> {
	if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.games;
	inflight ??= pvpgn
		.askAura('!games')
		.then((lines) => {
			if (!lines.length) throw new Error('no reply from aura');
			const games = parseAuraGames(lines);
			cache = { at: Date.now(), games };
			return games;
		})
		.finally(() => (inflight = null));
	return inflight;
}

export function invalidateAuraGames() {
	cache = null;
}

/**
 * Cancel an aura lobby. `!unhost` from a whisper can't name a game: it takes the most recent
 * lobby, so only act when that lobby is unambiguously the one asked for (max_lobbies = 1).
 * Needs the dashboard account in aura's realm admins (AURA_REALM1_ADMINS) for others' lobbies.
 */
export async function unhostLobby(id: number): Promise<{ ok: boolean; message: string }> {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	let games: AuraGame[];
	try {
		games = await auraGames({ fresh: true });
	} catch (e) {
		return { ok: false, message: `can't reach aura: ${(e as Error).message}` };
	}
	const target = games.find((g) => g.id === id);
	if (!target) return { ok: false, message: 'lobby gone' };
	if (!target.lobby) return { ok: false, message: 'lobby already started' };
	if (games.filter((g) => g.lobby).length > 1) return { ok: false, message: 'multiple lobbies open — unhost in-game' };

	const replies = await pvpgn.askAura('!unhost');
	invalidateAuraGames();
	if (replies.some((r) => r.startsWith('Aborting '))) return { ok: true, message: `Unhosted "${target.name}".` };
	return { ok: false, message: replies.join('\n') || "aura didn't confirm — the game may be starting" };
}

export type Hostable = { configs: string[]; maps: string[] };

/** mapcfg names (aura/data/mapcfgs/*.ini) + map files. Commas would break aura's arg split. */
export async function hostable(): Promise<Hostable> {
	const [cfgs, maps] = await Promise.all([
		readdir(mapcfgsDir()).catch(() => [] as string[]),
		listMaps().catch(() => [])
	]);
	const ok = (n: string) => !n.includes(',');
	return {
		configs: cfgs.filter((n) => n.toLowerCase().endsWith('.ini')).map((n) => n.slice(0, -4)).filter(ok).sort(),
		maps: maps.map((m) => m.name).filter(ok)
	};
}

const HOSTED_RE = /(Private game|Game) hosted: /;
const GAME_NAME_RE = /^[^,\r\n]{1,30}$/; // aura: comma-separated args, max 30 chars w/ default rehost template

/** `!host[priv] <map>, <name>` via whisper. Owner = dashboard account (absent → lobby ownerless after 2 min). */
export async function hostGame(o: { map: string; name: string; priv: boolean }): Promise<{ ok: boolean; message: string }> {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	const h = await hostable();
	if (!h.configs.includes(o.map) && !h.maps.includes(o.map)) return { ok: false, message: 'unknown map' };
	const name = (o.name.trim() || o.map.replace(/\.w3[xm]$/i, '')).slice(0, 30).trim();
	if (!GAME_NAME_RE.test(name)) return { ok: false, message: 'game name: 1-30 chars, no commas' };
	const cmd = `!host${o.priv ? 'priv' : ''} ${o.map}, ${name}`;
	if (`/w ${config.auraBot()} ${cmd}`.length > MAX_CMD_LEN) return { ok: false, message: 'map + game name too long' };

	let games: AuraGame[];
	try {
		games = await auraGames({ fresh: true });
	} catch (e) {
		return { ok: false, message: `can't reach aura: ${(e as Error).message}` };
	}
	if (games.some((g) => g.lobby)) return { ok: false, message: 'a lobby is already open (aura hosts 1 at a time)' };

	// "Game hosted" arrives after the map loads
	const replies = await pvpgn.askAura(cmd, { quietMs: 3000, maxMs: 20000 });
	invalidateAuraGames();
	const hosted = replies.find((r) => HOSTED_RE.test(r));
	if (hosted) return { ok: true, message: hosted };
	return { ok: false, message: replies.join('\n') || 'no reply from aura' };
}

/** `!owner <user>` on the current lobby. Over whisper aura only accepts players already in it. */
export async function giveOwner(user: string): Promise<{ ok: boolean; message: string }> {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	if (!validName(user)) return { ok: false, message: 'invalid user name' };
	const replies = await pvpgn.askAura(`!owner ${user}`);
	invalidateAuraGames();
	const msg = replies.join('\n') || 'no reply from aura';
	return { ok: /Setting game owner to|already the owner/.test(msg), message: msg };
}
