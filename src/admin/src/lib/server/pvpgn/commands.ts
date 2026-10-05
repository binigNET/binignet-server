// Admin actions over telnet. Success is judged by reply text (see SPIKE.md):
// many successes start with "ERROR:", so match on the message itself.
import { MAX_CMD_LEN, pvpgn } from './telnet';
import { files, readText, writeAtomic } from './files';

export type Result = { ok: boolean; message: string };

// pvpgn account names: letters, digits and a few symbols, no spaces
const NAME_RE = /^[A-Za-z0-9_\-\[\]().]{1,15}$/;
const IP_RE = /^[0-9.*\-]{3,31}$/; // ip, wildcard (1.2.*.*) or range
const ARG_RE = /^[^\r\n]+$/;

function strip(lines: string[]) {
	return (
		lines
			.map((l) => l.replace(/^ERROR: /, ''))
			.join('\n')
			// /alert replies with a raw message-box packet (0xFF 0x19 ...)
			.replace(/[\x00-\x09\x0b-\x1f\xff]/g, '')
	);
}

async function exec(cmd: string, success: RegExp, redact?: string): Promise<Result> {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	if (cmd.length > MAX_CMD_LEN) return { ok: false, message: `too long (max ${MAX_CMD_LEN} chars incl. command)` };
	const lines = await pvpgn.run(cmd);
	let message = strip(lines) || 'no reply';
	if (redact) message = message.replaceAll(redact, '•••');
	return { ok: success.test(message), message };
}

const bad = (message: string): Result => ({ ok: false, message });

export function validName(name: string) {
	return NAME_RE.test(name);
}

// --- messages ---

export function announce(msg: string) {
	if (!ARG_RE.test(msg)) return Promise.resolve(bad('empty message'));
	return exec(`/announce ${msg}`, /Announcement from/);
}

/** pop-up box to everyone; newlines become \n */
export function alert(msg: string) {
	const one = msg.trim().replace(/\r?\n/g, '\\n');
	if (!one) return Promise.resolve(bad('empty message'));
	return exec(`/alert ${one}`, /By \S+ for /).then((r) => (r.ok ? { ok: true, message: 'Alert sent.' } : r));
}

export function whisper(user: string, msg: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	if (!ARG_RE.test(msg)) return Promise.resolve(bad('empty message'));
	return exec(`/w ${user} ${msg}`, /^<to /m);
}

// --- motd / news (files + rehash) ---

const textFiles = { motd: { file: files.motd, rehash: 'i18n' }, news: { file: files.news, rehash: 'news' } };
export type TextKind = keyof typeof textFiles;

export const readTextFile = (kind: TextKind) => readText(textFiles[kind].file());

export async function saveTextFile(kind: TextKind, text: string): Promise<Result> {
	const { file, rehash } = textFiles[kind];
	await writeAtomic(file(), Buffer.from(text.replace(/\r\n/g, '\n'), 'latin1'));
	const r = await exec(`/rehash ${rehash}`, /is complete/);
	return r.ok ? { ok: true, message: `Saved and reloaded ${kind}.` } : { ok: false, message: `Saved file, reload failed: ${r.message}` };
}

// --- bans ---

export function ipBan(ip: string, minutes: number) {
	if (!IP_RE.test(ip)) return Promise.resolve(bad('invalid IP'));
	return exec(`/ipban a ${ip} ${Math.max(0, Math.floor(minutes))}`, /banned/);
}

export function ipUnban(ip: string) {
	if (!IP_RE.test(ip)) return Promise.resolve(bad('invalid IP'));
	return exec(`/ipban d ${ip}`, /Entry deleted/);
}

function hoursReason(hours: number, reason: string) {
	return `${Math.max(0, Math.floor(hours))}${reason.trim() ? ' ' + reason.trim().replace(/[\r\n]+/g, ' ') : ''}`;
}

export function lock(user: string, hours: number, reason: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	return exec(`/lock ${user} ${hoursReason(hours, reason)}`, /is now locked/);
}

export function unlock(user: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	return exec(`/unlock ${user}`, /now unlocked/);
}

export function mute(user: string, hours: number, reason: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	return exec(`/mute ${user} ${hoursReason(hours, reason)}`, /is now muted/);
}

export function unmute(user: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	return exec(`/unmute ${user}`, /now unmuted/);
}

// --- accounts ---

/** Replies echo the password and its hash: keep only the outcome lines. */
function hidePass(r: Result): Result {
	return { ...r, message: r.message.split('\n').filter((l) => !/Trying to|Hash is/.test(l)).join('\n') || r.message };
}

export function addAccount(user: string, pass: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name (1-15 chars, no spaces)'));
	if (!/^\S{3,}$/.test(pass)) return Promise.resolve(bad('password: 3+ chars, no spaces'));
	return exec(`/addacct ${user} ${pass}`, /Account \d+ created/, pass).then(hidePass);
}

export function chpass(user: string, pass: string) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	if (!/^\S{3,}$/.test(pass)) return Promise.resolve(bad('password: 3+ chars, no spaces'));
	return exec(`/chpass ${user} ${pass}`, /updated/, pass)
		.then(hidePass)
		.then((r) => (r.ok ? { ok: true, message: `Password for ${user} set to: ${pass}` } : r));
}

/** Disconnect. `banMinutes` > 0 also IP-bans; never sends 0 (= permanent IP ban). */
export function kill(user: string, banMinutes: number | null) {
	if (!validName(user)) return Promise.resolve(bad('invalid user name'));
	const min = banMinutes && banMinutes > 0 ? ` ${Math.floor(banMinutes)}` : '';
	return exec(`/kill ${user}${min}`, /Operation successful/);
}

// no delete command in pvpgn, and DB deletes get resurrected by bnetd's account cache
export const DELETED_REASON = 'account deleted';

/** Soft delete: permanent lock (lock doesn't disconnect), then kick if online. Unlock restores. */
export async function softDelete(user: string): Promise<Result> {
	const r = await lock(user, 0, DELETED_REASON);
	if (!r.ok) return r;
	const k = await kill(user, null);
	return { ok: true, message: `Deleted ${user} (locked permanently${k.ok ? ', kicked' : ''}). Unlock to restore.` };
}
