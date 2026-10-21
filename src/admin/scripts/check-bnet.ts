// Check the dashboard's ports of pvpgn's password hashes against a real account.
// Rerun after pvpgn upgrades. Reads the DB directly (docker-compose exposes 127.0.0.1:3306):
//   DB_PASS=... node --experimental-strip-types scripts/check-bnet.ts <username>
// Prompts for the password without echoing it.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import mysql from 'mysql2/promise';
import { bnetHash, parseRaw, srpVerifier } from '../src/lib/server/pvpgn/bnet-crypto.ts';

const user = process.argv[2];
if (!user) {
	console.error('usage: check-bnet.ts <username>');
	process.exit(2);
}

function askHidden(q: string): Promise<string> {
	process.stdout.write(q);
	const muted = new Writable({ write: (_c, _e, cb) => cb() });
	const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
	return new Promise((resolve) => rl.question('', (a) => (rl.close(), process.stdout.write('\n'), resolve(a))));
}

const conn = await mysql.createConnection({
	host: process.env.DB_HOST || '127.0.0.1',
	port: Number(process.env.DB_PORT || 3306),
	database: process.env.DB_NAME || 'bnetd',
	user: process.env.DB_USER || 'bnetd',
	password: process.env.DB_PASS || 'secret'
});
const prefix = process.env.DB_PREFIX || 'pvpgn_';
const [rows] = await conn.query(
	`SELECT acct_username AS name, acct_passhash1 AS hash, acct_salt AS salt, acct_verifier AS verifier FROM ${prefix}BNET WHERE username = LOWER(?) AND uid > 0`,
	[user]
);
await conn.end();
const r = (rows as { name: string; hash: string | null; salt: string | null; verifier: string | null }[])[0];
if (!r) {
	console.error(`no account ${user}`);
	process.exit(1);
}

const pass = await askHidden(`password for ${r.name}: `);
const salt = parseRaw(r.salt);
const verifier = parseRaw(r.verifier);
console.log('passhash1:', r.hash ? (bnetHash(pass) === r.hash.toLowerCase() ? 'match' : 'NO MATCH (stale after an in-game password change?)') : 'not set');
console.log('srp:      ', salt && verifier ? (srpVerifier(r.name, pass, salt).equals(verifier) ? 'match' : 'NO MATCH') : 'not set');
