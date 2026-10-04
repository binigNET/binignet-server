// Read-only access to pvpgn's MySQL. Writes go through telnet commands: bnetd caches
// accounts and overwrites direct DB edits on its next sync.
import mysql from 'mysql2/promise';
import { config } from '../env';

const g = globalThis as unknown as { __pvpgnDb?: mysql.Pool };

export function db(): mysql.Pool {
	if (!g.__pvpgnDb) {
		const { host, database, user, password } = config.db();
		g.__pvpgnDb = mysql.createPool({ host, database, user, password, connectionLimit: 4 });
	}
	return g.__pvpgnDb;
}

/** Prefixed table name, e.g. table('BNET') → pvpgn_BNET */
export const table = (name: string) => config.db().prefix + name;

export async function ping(): Promise<boolean> {
	try {
		await db().query('SELECT 1');
		return true;
	} catch {
		return false;
	}
}

export async function accountCount(): Promise<number> {
	// uid 0 is the default-user template row
	const [rows] = await db().query(`SELECT COUNT(*) AS n FROM ${table('BNET')} WHERE uid > 0`);
	return Number((rows as { n: number }[])[0].n);
}

export type Account = { username: string; lastLogin: Date | null };

export async function listAccounts(): Promise<Account[]> {
	const [rows] = await db().query(`SELECT username, acct_lastlogin_time AS t FROM ${table('BNET')} WHERE uid > 0`);
	return (rows as { username: string; t: string | number | null }[]).map((r) => ({
		username: r.username,
		lastLogin: Number(r.t) > 0 ? new Date(Number(r.t) * 1000) : null
	}));
}
