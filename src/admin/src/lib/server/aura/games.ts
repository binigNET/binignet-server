// aura's view of its games via whispered "!games" (see SPIKE.md).
// Item format: `Lobby#1: [Map Title] "name" - owner - 3/12 : 4min` (Game#N once started).
import { pvpgn } from '../pvpgn/telnet';

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
