// Ban state: ipbanfile (bnban.conf) + locked/muted accounts in MySQL.
import { db, table } from './db';
import { files, readText } from './files';

export type IpBan = { ip: string; until: Date | null };
export type AccountBan = { username: string; until: Date | null; reason: string };

export async function ipBans(): Promise<IpBan[]> {
	const text = await readText(files.bans());
	return text
		.split(/\r?\n/)
		.map((l) => l.replace(/#.*/, '').trim())
		.filter(Boolean)
		.map((l) => {
			const [ip, ts] = l.split(/\s+/);
			return { ip, until: ts && Number(ts) > 0 ? new Date(Number(ts) * 1000) : null };
		});
}

async function flagged(kind: 'lock' | 'mute'): Promise<AccountBan[]> {
	const [rows] = await db().query(
		`SELECT username, auth_${kind}time AS t, auth_${kind}reason AS reason FROM ${table('BNET')}
		 WHERE auth_${kind} = 'true' ORDER BY username`
	);
	return (rows as { username: string; t: string; reason: string | null }[]).map((r) => ({
		username: r.username,
		until: Number(r.t) > 0 ? new Date(Number(r.t) * 1000) : null,
		reason: r.reason ?? ''
	}));
}

export const lockedAccounts = () => flagged('lock');
export const mutedAccounts = () => flagged('mute');
