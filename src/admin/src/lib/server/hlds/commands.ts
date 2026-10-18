// RCON actions per game server. Most commands print nothing on success, so a
// command counts as done unless rcon itself fails.
import { readFile } from 'node:fs/promises';
import type { GameId } from '$lib/games';
import type { Result } from '../pvpgn/commands';
import { getLine, readCfg, setLine, writeCfg } from './cfg';
import { GAME_DEFS, dataPath, type Cvar } from './games';
import { parseBanList, parseCvars, parseMapcycle, parseMaps, parseStatus, type Ban, type Player } from './parse';
import { rcon } from './rcon';

const MAP_RE = /^[\w.+-]{1,64}$/;
// only real Steam IDs are bannable; LAN/BOT/HLTV ids are shared
const STEAMID_RE = /^STEAM_[0-5]:[01]:\d{1,10}$/;
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const MAX_BOTS = 31;

const bad = (message: string): Result => ({ ok: false, message });

/** Free text for the console: no quotes, newlines or `;` (command separator). */
const clean = (s: string) => s.replace(/["\\;\r\n\0]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 190);

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
	const target = (await GAME_DEFS[game].bots.readDefaults()).bots;
	if (bots >= target) return { ok: true, message: `Already ${bots} bots.` };
	return exec(game, GAME_DEFS[game].addBots(bots, target), `Bots: ${bots} → ${target}.`);
}

// --- players ---

export function kick(game: GameId, userid: number, reason: string): Promise<Result> {
	if (!Number.isInteger(userid) || userid < 1) return Promise.resolve(bad('invalid user id'));
	const r = clean(reason);
	return exec(game, [`kick #${userid}${r ? ` ${r}` : ''}`], 'Kicked.');
}

export type BanType = 'id' | 'ip' | 'both';

/** Ban by Steam ID and/or IP for `minutes` (0 = permanent), persist, then kick. */
export async function ban(
	game: GameId,
	p: { userid: number; uniqueid: string; ip: string },
	type: BanType,
	minutes: number,
	reason: string
): Promise<Result> {
	if (!Number.isInteger(minutes) || minutes < 0) return bad('invalid duration');
	const cmds: string[] = [];
	const notes: string[] = [];
	if (type !== 'ip') {
		if (STEAMID_RE.test(p.uniqueid)) cmds.push(`banid ${minutes} ${p.uniqueid}`, 'writeid');
		else if (type === 'id') return bad(`${p.uniqueid || 'id'} is not a bannable Steam ID — ban by IP`);
		else notes.push(`${p.uniqueid} not bannable, IP only`);
	}
	if (type !== 'id') {
		if (!IP_RE.test(p.ip)) return bad('invalid IP');
		cmds.push(`addip ${minutes} ${p.ip}`, 'writeip');
	}
	const k = await kick(game, p.userid, `Banned${reason.trim() ? `: ${reason}` : ''}`);
	const r = await exec(game, cmds, 'Banned.');
	if (!r.ok) return r;
	return { ok: true, message: ['Banned.', ...notes, k.ok ? '' : `kick failed: ${k.message}`].filter(Boolean).join(' ') };
}

export async function bans(game: GameId): Promise<{ ids: Ban[]; ips: Ban[]; error: string }> {
	try {
		const ids = parseBanList(await rcon(game).run('listid'));
		const ips = parseBanList(await rcon(game).run('listip'));
		return { ids, ips, error: '' };
	} catch (e) {
		return { ids: [], ips: [], error: (e as Error).message };
	}
}

export function unban(game: GameId, id: string): Promise<Result> {
	if (STEAMID_RE.test(id)) return exec(game, [`removeid ${id}`, 'writeid'], `Unbanned ${id}.`);
	if (IP_RE.test(id)) return exec(game, [`removeip ${id}`, 'writeip'], `Unbanned ${id}.`);
	return Promise.resolve(bad('invalid Steam ID / IP'));
}

// --- chat ---

const SAY = { chat: 'amx_say', center: 'amx_csay', hud: 'amx_tsay' } as const;
export type SayMode = keyof typeof SAY;

export function say(game: GameId, msg: string, mode: SayMode): Promise<Result> {
	const m = clean(msg);
	if (!m) return Promise.resolve(bad('empty message'));
	if (!Object.hasOwn(SAY, mode)) return Promise.resolve(bad('invalid mode'));
	return exec(game, [`${SAY[mode]} ${m}`], 'Sent.');
}

// --- bot settings ---

export async function botSettings(game: GameId) {
	const { skill } = GAME_DEFS[game].bots;
	const defaults = await GAME_DEFS[game].bots.readDefaults();
	return { defaults, skill: { min: skill.min, max: skill.max, hint: skill.hint } };
}

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

export function setBotSkill(game: GameId, n: number): Promise<Result> {
	const { skill } = GAME_DEFS[game].bots;
	if (!inRange(n, skill.min, skill.max)) return Promise.resolve(bad(`skill: ${skill.min}–${skill.max}`));
	return exec(game, [skill.cvar(n)], `Bot skill set to ${n}.`);
}

export async function saveBotDefaults(game: GameId, bots: number, skill: number): Promise<Result> {
	const b = GAME_DEFS[game].bots;
	if (!inRange(bots, 0, MAX_BOTS)) return bad(`bots: 0–${MAX_BOTS}`);
	if (!inRange(skill, b.skill.min, b.skill.max)) return bad(`skill: ${b.skill.min}–${b.skill.max}`);
	try {
		await b.saveDefaults(bots, skill);
	} catch (e) {
		return bad(`save failed: ${(e as Error).message}`);
	}
	return { ok: true, message: `Saved: ${bots} bots, skill ${skill} (used on server start).` };
}

// --- game settings (whitelisted cvars) ---

function cvarDef(game: GameId, name: string): Cvar | undefined {
	return GAME_DEFS[game].cvars.find((c) => c.name === name);
}

/** Normalised value, or null if invalid for the cvar. */
function checkValue(c: Cvar, raw: string): string | null {
	const v = raw.trim();
	if (c.type === 'text') return /^[^"\\;\r\n\0]{0,32}$/.test(v) ? v : null;
	if (c.type === 'bool') return v === '0' || v === '1' ? v : null;
	const n = Number(v);
	if (!v || !Number.isFinite(n) || n < c.type.min || n > c.type.max) return null;
	if (!c.type.float && !Number.isInteger(n)) return null;
	return String(n);
}

export async function cvars(game: GameId) {
	const def = GAME_DEFS[game];
	const saved = await readCfg(def.cvarFile());
	let live: Record<string, string> = {};
	let error = '';
	try {
		// one round trip: the server runs `a;b;c` and replies with every line
		live = parseCvars(await rcon(game).run(def.cvars.map((c) => c.name).join(';')));
	} catch (e) {
		error = (e as Error).message;
	}
	return {
		error,
		cvars: def.cvars.map((c) => ({ ...c, live: live[c.name] ?? null, saved: getLine(saved, c.name) }))
	};
}

export function setCvar(game: GameId, name: string, raw: string): Promise<Result> {
	const c = cvarDef(game, name);
	if (!c) return Promise.resolve(bad('unknown setting'));
	const v = checkValue(c, raw);
	if (v === null) return Promise.resolve(bad(`invalid value for ${c.label}`));
	return exec(game, [`${name} "${v}"`], `${c.label} = ${v || '(empty)'}`);
}

/** Write to the server cfg (persists) and apply now. */
export async function saveCvar(game: GameId, name: string, raw: string): Promise<Result> {
	const c = cvarDef(game, name);
	if (!c) return bad('unknown setting');
	const v = checkValue(c, raw);
	if (v === null) return bad(`invalid value for ${c.label}`);
	const file = GAME_DEFS[game].cvarFile();
	try {
		await writeCfg(file, setLine(await readCfg(file), name, v));
	} catch (e) {
		return bad(`save failed: ${(e as Error).message}`);
	}
	const r = await setCvar(game, name, v);
	return r.ok ? { ok: true, message: `${r.message} (saved)` } : { ok: false, message: `saved, but apply failed: ${r.message}` };
}

// --- console ---

/** Any console command (admin only); `;` chains commands like the in-game console. */
export async function raw(game: GameId, cmd: string): Promise<Result> {
	const c = cmd.trim();
	if (!c || c.length > 500 || /[\r\n\0]/.test(c)) return bad('invalid command');
	try {
		return { ok: true, message: (await rcon(game).run(c, { quietMs: 500 })).trimEnd() || '(no output)' };
	} catch (e) {
		return bad((e as Error).message);
	}
}
