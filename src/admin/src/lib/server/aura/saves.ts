// WC3 saved games (.w3z) in aura/data/saves, loaded via aura's `!hostsg <save>`.
// WC3 writes MP saves to every player's Save\Multiplayer\ and clients load their own
// copy by file name, so uploads keep their original name. aura reads the lobby params
// from `<save>.ini` beside it (a whisper can't fit map + name + 12 players).
import { inflateSync, constants as zlib } from 'node:zlib';
import { access, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validName } from '../pvpgn/commands';
import { MAX_CMD_LEN, pvpgn } from '../pvpgn/telnet';
import { config } from '../env';
import { listMaps, savesDir } from './files';
import { GAME_NAME_RE, auraGames, invalidateAuraGames, type AuraGame } from './games';
import type { Result } from './maps';

export const MAX_SAVE_BYTES = 8 * 1024 * 1024;
// any name WC3 allows except path separators / control chars; no leading dot
const NAME_RE = /^[^/\\\x00-\x1f]{1,120}\.w3z$/i;

const exists = (p: string) => access(p).then(() => true, () => false);

export function validSaveName(name: string) {
	return NAME_RE.test(name) && !name.startsWith('.') && path.basename(name) === name;
}

export type SaveSlot = { team: number; color: number; race: string; human: boolean };
export type SaveInfo = { mapFile: string; gameName: string; slots: SaveSlot[] };

const RACES: [number, string][] = [[1, 'Human'], [2, 'Orc'], [4, 'Night Elf'], [8, 'Undead'], [32, 'Random']];
const MAGIC = 'Warcraft III recorded game\x1a\0';

/**
 * Header of a packed save (aura packed.cpp + save_game.cpp). Slot bytes are
 * UID, download, status, computer, team, color, race, computer type, handicap.
 */
export function parseSave(buf: Buffer): SaveInfo {
	if (buf.subarray(0, MAGIC.length).toString('latin1') !== MAGIC) throw new Error('not a WC3 save file');
	const headerSize = buf.readUInt32LE(28);
	const headerVersion = buf.readUInt32LE(36);
	const numBlocks = buf.readUInt32LE(44);
	if (headerVersion === 0) throw new Error('save header too old');
	if (buf.readUInt16LE(58) !== 0) throw new Error('not a save file (replay?)');

	// header lives in the first block(s); a few is plenty
	const parts: Buffer[] = [];
	let off = headerSize;
	for (let i = 0; i < Math.min(numBlocks, 4) && off + 8 <= buf.length; i++) {
		const csize = buf.readUInt16LE(off);
		parts.push(inflateSync(buf.subarray(off + 8, off + 8 + csize), { finishFlush: zlib.Z_SYNC_FLUSH }));
		off += 8 + csize;
	}
	const data = Buffer.concat(parts);

	let pos = 0;
	const cstr = () => {
		const end = data.indexOf(0, pos);
		if (end < 0) throw new Error('truncated save header');
		const s = data.subarray(pos, end).toString('utf8');
		pos = end + 1;
		return s;
	};
	const mapPath = cstr();
	cstr();
	const gameName = cstr();
	cstr();
	cstr(); // encoded stat string
	pos += 10;
	const numSlots = data[pos++];
	if (!numSlots || numSlots > 24 || pos + numSlots * 9 > data.length) throw new Error('invalid slot data');
	const slots: SaveSlot[] = [];
	for (let i = 0; i < numSlots; i++, pos += 9) {
		const s = data.subarray(pos, pos + 9);
		slots.push({
			team: s[4],
			color: s[5],
			race: RACES.filter(([bit]) => s[6] & bit).map(([, n]) => n).join('/') || '?',
			human: s[2] === 2 && s[3] === 0
		});
	}
	return { mapFile: mapPath.slice(mapPath.lastIndexOf('\\') + 1), gameName, slots };
}

export type SaveFile = { name: string; size: number; mtime: Date; info: SaveInfo | null; error: string; map: string | null };

/** Saves w/ parsed header; `map` = matching file in maps/ (aura compares case-insensitively). */
export async function listSaves(): Promise<SaveFile[]> {
	const names = (await readdir(savesDir()).catch(() => [] as string[])).filter(validSaveName);
	const maps = await listMaps().catch(() => []);
	const saves = await Promise.all(
		names.map(async (name) => {
			const file = path.join(savesDir(), name);
			const st = await stat(file);
			let info: SaveInfo | null = null;
			let error = '';
			try {
				info = parseSave(await readFile(file));
			} catch (e) {
				error = (e as Error).message;
			}
			const map = info ? (maps.find((m) => m.name.toLowerCase() === info.mapFile.toLowerCase())?.name ?? null) : null;
			return { name, size: st.size, mtime: st.mtime, info, error, map };
		})
	);
	return saves.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

export async function uploadSave(name: string, data: Buffer): Promise<Result> {
	if (!validSaveName(name)) return { ok: false, message: 'invalid file name (.w3z, max 120 chars, no slashes)' };
	if (data.length > MAX_SAVE_BYTES) return { ok: false, message: 'save larger than 8 MB' };
	try {
		parseSave(data);
	} catch (e) {
		return { ok: false, message: (e as Error).message };
	}
	await mkdir(savesDir(), { recursive: true });
	const dest = path.join(savesDir(), name);
	const replaced = await exists(dest);
	const tmp = path.join(savesDir(), `.${name}.upload`);
	await writeFile(tmp, data);
	await rename(tmp, dest);
	return { ok: true, message: `${replaced ? 'Replaced' : 'Uploaded'} ${name}.` };
}

export async function deleteSave(name: string): Promise<Result> {
	if (!validSaveName(name)) return { ok: false, message: 'invalid save name' };
	await unlink(path.join(savesDir(), name)).catch(() => {});
	await unlink(path.join(savesDir(), `${name}.ini`)).catch(() => {});
	return { ok: true, message: `Deleted ${name}.` };
}

const HOSTED_RE = /Loaded game hosted: /;

/** Write `<save>.ini`, `!hostsg <save>`; on success the save is no longer needed (players have their own copies). */
export async function hostSave(o: { save: string; name: string; players: string[] }): Promise<Result> {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	if (!validSaveName(o.save)) return { ok: false, message: 'invalid save name' };
	const cmd = `!hostsg ${o.save}`;
	if (`/w ${config.auraBot()} ${cmd}`.length > MAX_CMD_LEN) return { ok: false, message: 'save file name too long' };
	const save = (await listSaves()).find((s) => s.name === o.save);
	if (!save?.info) return { ok: false, message: save ? save.error : 'save gone' };
	if (!save.map) return { ok: false, message: `map ${save.info.mapFile} not uploaded` };
	const humans = save.info.slots.filter((s) => s.human).length;
	if (o.players.length !== humans || o.players.some((p) => !p)) return { ok: false, message: `enter a player for each of the ${humans} slots` };
	const bad = o.players.find((p) => !validName(p));
	if (bad) return { ok: false, message: `invalid user name: ${bad}` };
	const lower = o.players.map((p) => p.toLowerCase());
	if (new Set(lower).size !== lower.length) return { ok: false, message: 'a player is listed twice' };
	const name = (o.name.trim() || save.info.gameName).slice(0, 30).trim();
	if (!GAME_NAME_RE.test(name)) return { ok: false, message: 'game name: 1-30 chars, no commas' };

	let games: AuraGame[];
	try {
		games = await auraGames({ fresh: true });
	} catch (e) {
		return { ok: false, message: `can't reach aura: ${(e as Error).message}` };
	}
	if (games.some((g) => g.lobby)) return { ok: false, message: 'a lobby is already open (aura hosts 1 at a time)' };

	const ini = path.join(savesDir(), `${o.save}.ini`);
	await writeFile(ini, `map = ${save.map}\nname = ${name}\nplayers = ${o.players.join(' ')}\n`);
	// "Loaded game hosted" arrives after the map loads
	const replies = await pvpgn.askAura(cmd, { quietMs: 3000, maxMs: 20000 });
	invalidateAuraGames();
	const hosted = replies.find((r) => HOSTED_RE.test(r));
	if (hosted) {
		await deleteSave(o.save);
		return { ok: true, message: `${hosted}\nAuto-starts when all ${humans} players join.` };
	}
	await unlink(ini).catch(() => {});
	return { ok: false, message: replies.join('\n') || 'no reply from aura' };
}
