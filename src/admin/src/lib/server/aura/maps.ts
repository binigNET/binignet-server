// Map management in aura/data/maps. Cfgs (mapcfgs/*.ini) point at maps via
// `map.local_path` (+ `map.path`); cfg file names are arbitrary aliases.
import { access, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auraGames } from './games';
import { mapcfgsDir, mapsDir } from './files';

export type Result = { ok: boolean; message: string };

export const MAX_MAP_BYTES = 8 * 1024 * 1024; // WC3 1.26 map size limit
const NAME_RE = /^[\w .,()[\]~'!&+-]{1,96}\.w3[xm]$/i;

const exists = (p: string) => access(p).then(() => true, () => false);

export function validMapName(name: string) {
	return NAME_RE.test(name) && !name.startsWith('.') && path.basename(name) === name;
}

type Cfg = { file: string; text: string; localPath: string; title: string };

async function cfgs(): Promise<Cfg[]> {
	const names = (await readdir(mapcfgsDir()).catch(() => [] as string[])).filter((n) => n.endsWith('.ini'));
	return Promise.all(
		names.map(async (n) => {
			const file = path.join(mapcfgsDir(), n);
			const text = await readFile(file, 'utf8');
			const get = (k: string) => new RegExp(`^${k.replace('.', '\\.')}\\s*=\\s*(.*)$`, 'm').exec(text)?.[1].trim() ?? '';
			return { file, text, localPath: get('map.local_path'), title: get('map.title') };
		})
	);
}

/** Maps in an open lobby are being downloaded from aura; started games don't need the file. */
async function inOpenLobby(name: string): Promise<string | null> {
	const lobbies = (await auraGames()).filter((g) => g.lobby);
	if (!lobbies.length) return null;
	const titles = (await cfgs()).filter((c) => c.localPath === name && c.title).map((c) => c.title);
	// no cfg title → can't tell which map a lobby uses, so assume it might be this one
	const hit = titles.length ? lobbies.find((l) => titles.includes(l.map)) : lobbies[0];
	return hit ? `open lobby "${hit.name}" (${hit.map})` : null;
}

export async function uploadMap(name: string, data: Buffer): Promise<Result> {
	if (!validMapName(name)) return { ok: false, message: 'invalid file name (.w3x/.w3m, letters, digits, spaces, ._-()[]~\'!&+,)' };
	if (data.length > MAX_MAP_BYTES) return { ok: false, message: 'map larger than 8 MB (WC3 1.26 limit)' };
	if (data.subarray(0, 4).toString('latin1') !== 'HM3W') return { ok: false, message: 'not a WC3 map file' };
	const dest = path.join(mapsDir(), name);
	if (await exists(dest)) return { ok: false, message: `${name} already exists` };
	const tmp = path.join(mapsDir(), `.${name}.upload`);
	await writeFile(tmp, data);
	await rename(tmp, dest);
	return { ok: true, message: `Uploaded ${name}. Host it with !host <part of name>.` };
}

export async function deleteMap(name: string): Promise<Result> {
	if (!validMapName(name)) return { ok: false, message: 'invalid map name' };
	let busy: string | null;
	try {
		busy = await inOpenLobby(name);
	} catch {
		return { ok: false, message: "can't reach aura to check open lobbies; try again" };
	}
	if (busy) return { ok: false, message: `in use: ${busy}` };
	await unlink(path.join(mapsDir(), name));
	return { ok: true, message: `Deleted ${name}.` };
}

export async function renameMap(from: string, to: string): Promise<Result> {
	if (!validMapName(from) || !validMapName(to)) return { ok: false, message: 'invalid map name' };
	if (from === to) return { ok: false, message: 'same name' };
	const dest = path.join(mapsDir(), to);
	if (await exists(dest)) return { ok: false, message: `${to} already exists` };
	let busy: string | null;
	try {
		busy = await inOpenLobby(from);
	} catch {
		return { ok: false, message: "can't reach aura to check open lobbies; try again" };
	}
	if (busy) return { ok: false, message: `in use: ${busy}` };
	await rename(path.join(mapsDir(), from), dest);
	// repoint cfgs at the new file name
	let n = 0;
	for (const c of await cfgs()) {
		if (c.localPath !== from) continue;
		const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const text = c.text
			.replace(/^(map\.local_path\s*=\s*).*$/m, `$1${to}`)
			.replace(new RegExp(`^(map\\.path\\s*=\\s*.*\\\\)${esc}\\s*$`, 'm'), `$1${to}`);
		await writeFile(c.file, text);
		n++;
	}
	return { ok: true, message: `Renamed to ${to}${n ? `, updated ${n} map config${n > 1 ? 's' : ''}` : ''}.` };
}
