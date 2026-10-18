// RCON actions per game server. Most commands print nothing on success, so a
// command counts as done unless rcon itself fails.
import { readFile } from 'node:fs/promises';
import type { GameId } from '$lib/games';
import type { Result } from '../pvpgn/commands';
import { GAME_DEFS, dataPath } from './games';
import { parseMapcycle, parseMaps, parseStatus, type Player } from './parse';
import { rcon } from './rcon';

const MAP_RE = /^[\w.+-]{1,64}$/;
const MAX_BOTS = 31;

const bad = (message: string): Result => ({ ok: false, message });

async function exec(game: GameId, cmds: string[], done: string): Promise<Result> {
	try {
		const out: string[] = [];
		for (const c of cmds) out.push(await rcon(game).run(c));
		return { ok: true, message: out.join('').trim() || done };
	} catch (e) {
		return bad((e as Error).message);
	}
}

export async function players(game: GameId): Promise<{ players: Player[]; bots: number; error: string }> {
	try {
		const all = parseStatus(await rcon(game).run('status'));
		return { players: all.filter((p) => !p.bot), bots: all.filter((p) => p.bot).length, error: '' };
	} catch (e) {
		return { players: [], bots: 0, error: (e as Error).message };
	}
}

// `maps *` scans the disk; cache it briefly since pages auto-refresh
const mapCache = new Map<GameId, { at: number; maps: string[] }>();

async function serverMaps(game: GameId): Promise<string[]> {
	const hit = mapCache.get(game);
	if (hit && Date.now() - hit.at < 60_000) return hit.maps;
	const maps = parseMaps(await rcon(game).run('maps *', { quietMs: 500 }));
	if (maps.length) mapCache.set(game, { at: Date.now(), maps });
	return maps;
}

/** Map choices: mapcycle order first, then the rest (minus hidden), alphabetically. */
export async function mapList(game: GameId): Promise<{ cycle: string[]; other: string[] }> {
	const all = await serverMaps(game).catch(() => [] as string[]);
	const cycleFile = await readFile(dataPath(game, 'mapcycle.txt'), 'latin1').catch(() => '');
	const cycle = parseMapcycle(cycleFile).filter((m) => all.includes(m));
	const hide = GAME_DEFS[game].hideMaps;
	const other = all.filter((m) => !cycle.includes(m) && !hide?.test(m));
	return { cycle: [...new Set(cycle)], other };
}

export async function changeMap(game: GameId, map: string): Promise<Result> {
	if (!MAP_RE.test(map)) return bad('invalid map name');
	mapCache.delete(game);
	const maps = await serverMaps(game).catch(() => null);
	if (maps && maps.length && !maps.includes(map)) return bad(`map ${map} not on server`);
	return exec(game, [`changelevel ${map}`], `Changing map to ${map}.`);
}

export function restart(game: GameId): Promise<Result> {
	const r = GAME_DEFS[game].restart;
	return exec(game, [r.cmd], `${r.label}: done.`);
}

export function kickBots(game: GameId): Promise<Result> {
	return exec(game, GAME_DEFS[game].kickBots, 'Bots kicked.');
}

/** Add `n` bots on top of the current ones. */
export async function addBots(game: GameId, n: number): Promise<Result> {
	if (!Number.isInteger(n) || n < 1 || n > MAX_BOTS) return bad(`bots: 1–${MAX_BOTS}`);
	const { bots, error } = await players(game);
	if (error) return bad(error);
	const target = Math.min(bots + n, MAX_BOTS);
	return exec(game, GAME_DEFS[game].addBots(bots, target), `Adding bots: ${bots} → ${target}.`);
}

/** Bring bots back to the default count. */
export async function reAddBots(game: GameId): Promise<Result> {
	const { bots, error } = await players(game);
	if (error) return bad(error);
	const target = GAME_DEFS[game].defaultBots;
	if (bots >= target) return { ok: true, message: `Already ${bots} bots.` };
	return exec(game, GAME_DEFS[game].addBots(bots, target), `Bots: ${bots} → ${target}.`);
}
