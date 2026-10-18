// A2S_INFO server query (no password): name, map, player counts. Handles the
// S2C_CHALLENGE ('A') round trip newer engines require, and the old GoldSrc 'm' reply.
import { exchange, HEADER } from './rcon';

export type ServerInfo = { name: string; map: string; players: number; maxPlayers: number; bots: number };

const QUERY = Buffer.concat([HEADER, Buffer.from('TSource Engine Query\0', 'latin1')]);
const OPTS = { firstMs: 1000, quietMs: 50, maxMs: 1000 };

function reader(buf: Buffer, pos: number) {
	return {
		str() {
			const end = buf.indexOf(0, pos);
			const s = buf.toString('utf8', pos, end < 0 ? buf.length : end);
			pos = end < 0 ? buf.length : end + 1;
			return s;
		},
		byte: () => buf[pos++] ?? 0,
		skip: (n: number) => void (pos += n)
	};
}

export function parseInfo(p: Buffer): ServerInfo | null {
	const r = reader(p, 5);
	if (p[4] === 0x49) {
		// 'I': protocol, name, map, folder, game, appid(2), players, max, bots
		r.byte();
		const name = r.str();
		const map = r.str();
		r.str();
		r.str();
		r.skip(2);
		return { name, map, players: r.byte(), maxPlayers: r.byte(), bots: r.byte() };
	}
	if (p[4] === 0x6d) {
		// 'm' (GoldSrc): address, name, map, folder, game, players, max (no bot count)
		r.str();
		const name = r.str();
		const map = r.str();
		r.str();
		r.str();
		return { name, map, players: r.byte(), maxPlayers: r.byte(), bots: 0 };
	}
	return null;
}

async function queryOnce(host: string, port: number): Promise<ServerInfo | null> {
	let reply = await exchange(host, port, QUERY, OPTS);
	const ch = reply.find((p) => p[4] === 0x41 && p.length >= 9);
	if (ch) reply = await exchange(host, port, Buffer.concat([QUERY, ch.subarray(5, 9)]), OPTS);
	for (const p of reply) {
		const info = parseInfo(p);
		if (info) return info;
	}
	return null;
}

/** One retry: servers rate-limit queries per IP (sv_max_queries_sec) and drop the excess. */
export async function queryInfo(host: string, port: number): Promise<ServerInfo> {
	const info = (await queryOnce(host, port)) ?? (await queryOnce(host, port));
	if (!info) throw new Error('no reply');
	return info;
}
