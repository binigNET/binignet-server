// bnetd XML status (statusdir/server.xml), rewritten every output_update_secs.
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { config } from '../env';

export type StatusUser = { name: string; clienttag: string; version: string; country: string; gameid?: number };
export type StatusGame = { id: number; name: string; clienttag: string };
export type Status = { updatedAt: Date; uptimeS: number; users: StatusUser[]; games: StatusGame[] };

const parser = new XMLParser({
	isArray: (name) => ['user', 'game', 'channel'].includes(name),
	parseTagValue: false
});
let cache: { mtimeMs: number; status: Status } | null = null;

const list = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

export async function readStatus(): Promise<Status | null> {
	const file = path.join(config.paths.pvpgnStatus, 'server.xml');
	let st;
	try {
		st = await stat(file);
	} catch {
		return null;
	}
	if (cache?.mtimeMs === st.mtimeMs) return cache.status;
	const doc = parser.parse(await readFile(file, 'utf8')).status ?? {};
	const up = doc.Uptime ?? {};
	const status: Status = {
		updatedAt: st.mtime,
		uptimeS: ((+up.Days || 0) * 24 + (+up.Hours || 0)) * 3600 + (+up.Minutes || 0) * 60 + (+up.Seconds || 0),
		users: list<Record<string, string>>(doc.Users?.user).map((u) => ({
			name: u.name ?? '',
			clienttag: u.clienttag ?? '',
			version: u.version ?? '',
			country: u.country ?? '',
			gameid: u.gameid ? Number(u.gameid) : undefined
		})),
		games: list<Record<string, string>>(doc.Games?.game).map((g) => ({
			id: Number(g.id),
			name: g.name ?? '',
			clienttag: g.clienttag ?? ''
		}))
	};
	cache = { mtimeMs: st.mtimeMs, status };
	return status;
}
