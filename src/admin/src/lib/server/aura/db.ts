// aura's SQLite db (aura/data/aura.db), opened read-only; aura owns writes.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { auraPath } from './files';

const g = globalThis as unknown as { __auraDb?: DatabaseSync };

export function auraDb(): DatabaseSync | null {
	if (g.__auraDb) return g.__auraDb;
	const file = auraPath('aura.db');
	if (!existsSync(file)) return null;
	g.__auraDb = new DatabaseSync(file, { readOnly: true });
	return g.__auraDb;
}
