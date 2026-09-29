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
