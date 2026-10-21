// Ports of pvpgn 1.99.7.2.1 password checks. No $lib imports: scripts/check-bnet.ts uses this too.
//  - bnetHash: src/common/bnethash.cpp bnet_hash + hash_get_str ("broken SHA-1"), stored as acct_passhash1
//  - srpVerifier: src/common/bnetsrp3.cpp getVerifier (WC3 NLS/SRP3), stored as acct_salt + acct_verifier
import { createHash } from 'node:crypto';

const rotl = (x: number, n: number) => ((x << (n & 31)) | (x >>> (-n & 31))) >>> 0;
// pvpgn's safe_tolower/safe_toupper: ASCII only
const lower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
const upper = (s: string) => s.replace(/[a-z]/g, (c) => c.toUpperCase());

/** acct_passhash1 for `pass` (pvpgn lowercases before hashing) */
export function bnetHash(pass: string): string {
	const data = Buffer.from(lower(pass));
	const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
	const w = new Array<number>(80);
	// 64-byte blocks, little-endian words, zero fill, no length padding
	for (let off = 0; off < data.length; off += 64) {
		for (let i = 0; i < 16; i++) {
			const p = off + i * 4;
			w[i] = ((data[p] ?? 0) | ((data[p + 1] ?? 0) << 8) | ((data[p + 2] ?? 0) << 16) | ((data[p + 3] ?? 0) << 24)) >>> 0;
		}
		// the blizzard bug: rotates 1 by the value instead of the value by 1
		for (let i = 0; i < 64; i++) w[i + 16] = rotl(1, w[i] ^ w[i + 8] ^ w[i + 2] ^ w[i + 13]);
		let [a, b, c, d, e] = h;
		for (let i = 0; i < 80; i++) {
			const f =
				i < 20 ? ((b & c) | (~b & d)) + 0x5a827999
				: i < 40 ? (d ^ c ^ b) + 0x6ed9eba1
				: i < 60 ? ((c & b) | (d & c) | (d & b)) + 0x8f1bbcdc
				: (d ^ c ^ b) + 0xca62c1d6;
			const g = (w[i] + rotl(a, 5) + e + f) >>> 0;
			e = d;
			d = c;
			c = rotl(b, 30);
			b = a;
			a = g;
		}
		h[0] = (h[0] + a) >>> 0;
		h[1] = (h[1] + b) >>> 0;
		h[2] = (h[2] + c) >>> 0;
		h[3] = (h[3] + d) >>> 0;
		h[4] = (h[4] + e) >>> 0;
	}
	return h.map((x) => x.toString(16).padStart(8, '0')).join('');
}

const N = BigInt('0xF8FF1A8B619918032186B68CA092B5557E976C78C73212D91216F6658523C787');
const G = 47n;

const sha1 = (...parts: Buffer[]) => createHash('sha1').update(Buffer.concat(parts)).digest();

function fromLE(b: Buffer): bigint {
	let n = 0n;
	for (let i = b.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(b[i]);
	return n;
}

function toLE(n: bigint, len: number): Buffer {
	const out = Buffer.alloc(len);
	for (let i = 0; i < len; i++, n >>= 8n) out[i] = Number(n & 0xffn);
	return out;
}

function powm(base: bigint, exp: bigint, mod: bigint): bigint {
	let r = 1n;
	for (base %= mod; exp > 0n; exp >>= 1n, base = (base * base) % mod) if (exp & 1n) r = (r * base) % mod;
	return r;
}

/** 32-byte verifier (as stored) for `user`/`pass` and the stored 32-byte salt; case-insensitive */
export function srpVerifier(user: string, pass: string, salt: Buffer): Buffer {
	const x = fromLE(sha1(salt, sha1(Buffer.from(`${upper(user)}:${upper(pass)}`))));
	return toLE(powm(G, x, N), 32);
}

/** pvpgn raw attrs (acct_salt, acct_verifier) are stored as "C2 52 6E ..." */
export const parseRaw = (s: string | null): Buffer | null => {
	const b = Buffer.from((s ?? '').replace(/\s+/g, ''), 'hex');
	return b.length === 32 ? b : null;
};
