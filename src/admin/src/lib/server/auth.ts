import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './env';

export const COOKIE = 'session';
export const SESSION_TTL_S = 7 * 24 * 3600;

const sha256 = (s: string) => createHash('sha256').update(s).digest();

// key derived from password: changing ADMIN_PASSWORD invalidates all sessions
const key = () => sha256('session:' + config.adminPassword());

export function checkPassword(input: string): boolean {
	return timingSafeEqual(sha256(input), sha256(config.adminPassword()));
}

export function signSession(now = Date.now()): string {
	const exp = Math.floor(now / 1000) + SESSION_TTL_S;
	const mac = createHmac('sha256', key()).update(String(exp)).digest('base64url');
	return `${exp}.${mac}`;
}

export function verifySession(token: string | undefined, now = Date.now()): boolean {
	if (!token) return false;
	const [exp, mac] = token.split('.');
	if (!exp || !mac || Number(exp) * 1000 < now) return false;
	const want = createHmac('sha256', key()).update(exp).digest();
	const got = Buffer.from(mac, 'base64url');
	return got.length === want.length && timingSafeEqual(got, want);
}

// 5 failed logins / 15 min / IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, number[]>();

export function isLimited(ip: string, now = Date.now()): boolean {
	const recent = (fails.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	fails.set(ip, recent);
	return recent.length >= MAX_FAILS;
}

export function recordFail(ip: string, now = Date.now()) {
	fails.set(ip, [...(fails.get(ip) ?? []), now]);
}
