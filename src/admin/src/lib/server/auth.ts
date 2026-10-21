import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Role, User } from '$lib/access';
import { config } from './env';

export const COOKIE = 'session';
export const SESSION_TTL_S = 7 * 24 * 3600;

const sha256 = (s: string) => createHash('sha256').update(s).digest();

// key derived from password: changing ADMIN_PASSWORD invalidates all sessions
const key = () => sha256('session:' + config.adminPassword());

export function checkPassword(input: string): boolean {
	return timingSafeEqual(sha256(input), sha256(config.adminPassword()));
}

/** Session user + `fp`: the player's credential fingerprint at login ('-' for admin) */
export type Session = User & { fp: string };

const mac = (payload: string) => createHmac('sha256', key()).update(payload).digest();

// token: role.name(base64url).fp.exp.mac
export function signSession(s: Session, now = Date.now()): string {
	const exp = Math.floor(now / 1000) + SESSION_TTL_S;
	const payload = [s.role, Buffer.from(s.name).toString('base64url'), s.fp, exp].join('.');
	return `${payload}.${mac(payload).toString('base64url')}`;
}

export function verifySession(token: string | undefined, now = Date.now()): Session | null {
	const parts = token?.split('.') ?? [];
	if (parts.length !== 5) return null;
	const [role, name, fp, exp, sig] = parts;
	if (role !== 'admin' && role !== 'player') return null;
	if (Number(exp) * 1000 < now) return null;
	const want = mac(parts.slice(0, 4).join('.'));
	const got = Buffer.from(sig, 'base64url');
	if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
	return { role: role as Role, name: Buffer.from(name, 'base64url').toString(), fp };
}

// failed logins / 15 min: 5 per username+IP, 20 per IP (players at a LAN share one IP)
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_USER = 5;
const MAX_FAILS_IP = 20;
const fails = new Map<string, number[]>();

function recent(k: string, now: number) {
	const r = (fails.get(k) ?? []).filter((t) => now - t < WINDOW_MS);
	if (r.length) fails.set(k, r);
	else fails.delete(k);
	return r.length;
}

const userKey = (ip: string, user: string) => `${ip}|${user.toLowerCase()}`;

export function isLimited(ip: string, user: string, now = Date.now()): boolean {
	return recent(ip, now) >= MAX_FAILS_IP || recent(userKey(ip, user), now) >= MAX_FAILS_USER;
}

export function recordFail(ip: string, user: string, now = Date.now()) {
	for (const k of [ip, userKey(ip, user)]) fails.set(k, [...(fails.get(k) ?? []), now]);
}
