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

/** Cached ~15s; one whisper in flight at a time. Throws if pvpgn/aura unreachable. */
export async function auraGames(): Promise<AuraGame[]> {
	if (cache && Date.now() - cache.at < TTL_MS) return cache.games;
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
