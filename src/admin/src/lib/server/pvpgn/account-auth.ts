// Player login against pvpgn accounts (read-only, see db.ts).
import { createHash, timingSafeEqual } from 'node:crypto';
import { bnetHash, parseRaw, srpVerifier } from './bnet-crypto';
import { db, table } from './db';

type Row = { name: string; hash: string | null; salt: string | null; verifier: string | null; locked: string | null };

async function row(user: string): Promise<Row | null> {
	const [rows] = await db().query(
		`SELECT acct_username AS name, acct_passhash1 AS hash, acct_salt AS salt, acct_verifier AS verifier, auth_lock AS locked
		 FROM ${table('BNET')} WHERE username = LOWER(?) AND uid > 0`,
		[user]
	);
	return (rows as Row[])[0] ?? null;
}

/**
 * The credential the game checks: SRP salt+verifier (WC3 login, and what an in-game password
 * change updates); passhash1 only for accounts without them (made via telnet, never logged in).
 */
function credential(r: Row): { kind: 'srp'; salt: Buffer; verifier: Buffer } | { kind: 'hash'; hash: string } | null {
	const salt = parseRaw(r.salt);
	const verifier = parseRaw(r.verifier);
	if (salt && verifier) return { kind: 'srp', salt, verifier };
	return r.hash ? { kind: 'hash', hash: r.hash.toLowerCase() } : null;
}

/** Changes when the password does; carried in the session so a password change logs players out. */
function fingerprint(r: Row): string {
	const c = credential(r);
	const src = c?.kind === 'srp' ? c.verifier.toString('hex') : (c?.hash ?? '');
	return createHash('sha256').update(src).digest('base64url').slice(0, 12);
}

const same = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/** Account name (as registered) + credential fingerprint, or null for wrong pass / locked / unknown. */
export async function verifyAccount(user: string, pass: string): Promise<{ name: string; fp: string } | null> {
	if (!user || !pass) return null;
	const r = await row(user);
	if (!r || r.locked === 'true') return null;
	const c = credential(r);
	if (!c) return null;
	const ok =
		c.kind === 'srp' ? same(srpVerifier(r.name, pass, c.salt), c.verifier) : same(Buffer.from(bnetHash(pass)), Buffer.from(c.hash));
	return ok ? { name: r.name, fp: fingerprint(r) } : null;
}

// re-check sessions at most once a minute per account
const RECHECK_MS = 60_000;
const checked = new Map<string, { at: number; fp: string | null }>();

/**
 * Is a player session still good? 'revoked' when the account is gone, locked or its password changed;
 * 'unknown' when the DB is unreachable (sessions are kept then).
 */
export async function checkAccount(name: string, fp: string, now = Date.now()): Promise<'ok' | 'revoked' | 'unknown'> {
	let hit = checked.get(name);
	if (!hit || now - hit.at >= RECHECK_MS) {
		try {
			const r = await row(name);
			hit = { at: now, fp: r && r.locked !== 'true' ? fingerprint(r) : null };
			checked.set(name, hit);
		} catch {
			return hit ? (hit.fp === fp ? 'ok' : 'revoked') : 'unknown';
		}
	}
	return hit.fp === fp ? 'ok' : 'revoked';
}
