// Per-player WC3 ladder stats + icon. Read from MySQL (after /save), write via /set.
// AT stats are per team (pvpgn_arrangedteam) and not editable here.
import { db, table } from './db';
import { pvpgn } from './telnet';

export const LADDERS = ['solo', 'team', 'ffa'] as const;
export const FIELDS = ['level', 'xp', 'wins', 'losses'] as const;
export type Stats = Record<`${(typeof LADDERS)[number]}_${(typeof FIELDS)[number]}`, number>;
export const RACE_STATS = ['humans', 'orcs', 'nightelves', 'undead', 'random'] as const;
export type Details = {
	email: string | null;
	emailVerified: boolean;
	created: Date | null;
	lastLogin: Date | null;
	lastIp: string | null;
	lastOwner: string | null;
	lastClient: string | null;
	admin: boolean;
	operator: boolean;
	locked: boolean;
	lockUntil: Date | null;
	lockReason: string | null;
	muted: boolean;
	muteUntil: Date | null;
	muteReason: string | null;
	commandGroups: string | null;
	profile: { sex: string | null; age: string | null; location: string | null; clan: string | null; description: string | null };
	races: Record<(typeof RACE_STATS)[number], { wins: number; losses: number }>;
};
export type Player = { uid: number; username: string; stats: Stats; icon: string; details: Details };

// "Max all" preset. Level 65 = bnxplevel.conf cap (holds if xp >= 29500; pvpgn recomputes level from xp after games).
// Profile packet sends wins/losses/xp as 16 bits, so wins <= 32767 to stay safe if read signed.
export const MAX_STATS = { level: 65, xp: 30000, wins: 32767, losses: 0 } satisfies Record<(typeof FIELDS)[number], number>;

const COLS = LADDERS.flatMap((l) => FIELDS.map((f) => `${l}_${f}` as keyof Stats));

const str = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v));
/** unix seconds (int or string column) → Date; 0/empty → null */
const time = (v: unknown) => (Number(v) > 0 ? new Date(Number(v) * 1000) : null);

export async function getPlayer(name: string): Promise<Player | null> {
	const [rows] = await db().query(
		`SELECT b.*, ${COLS.map((c) => `r.W3XP_${c} AS ${c}`).join(', ')}, r.W3XP_userselected_icon AS icon,
		 ${RACE_STATS.flatMap((x) => [`r.W3XP_${x}_wins AS ${x}_wins`, `r.W3XP_${x}_losses AS ${x}_losses`]).join(', ')},
		 p.sex, p.age, p.location, p.clanname, p.description
		 FROM ${table('BNET')} b LEFT JOIN ${table('Record')} r ON r.uid = b.uid LEFT JOIN ${table('profile')} p ON p.uid = b.uid
		 WHERE b.uid > 0 AND LOWER(b.username) = LOWER(?)`,
		[name]
	);
	const r = (rows as Record<string, unknown>[])[0];
	if (!r) return null;
	return {
		uid: Number(r.uid),
		username: String(r.username),
		stats: Object.fromEntries(COLS.map((c) => [c, Number(r[c]) || 0])) as Stats,
		icon: r.icon && r.icon !== 'NULL' ? String(r.icon) : '', // pvpgn writes "NULL" for unset
		details: {
			email: str(r.acct_email),
			emailVerified: r.acct_email_verified === 'true',
			created: time(r.acct_ctime),
			lastLogin: time(r.acct_lastlogin_time),
			lastIp: str(r.acct_lastlogin_ip),
			lastOwner: str(r.acct_lastlogin_owner),
			lastClient: str(r.acct_lastlogin_clienttag),
			admin: r.auth_admin === 'true',
			operator: r.auth_operator === 'true',
			locked: r.auth_lock === 'true',
			lockUntil: time(r.auth_locktime),
			lockReason: str(r.auth_lockreason),
			muted: r.auth_mute === 'true',
			muteUntil: time(r.auth_mutetime),
			muteReason: str(r.auth_mutereason),
			commandGroups: str(r.auth_command_groups),
			profile: { sex: str(r.sex), age: str(r.age), location: str(r.location), clan: str(r.clanname), description: str(r.description) },
			races: Object.fromEntries(
				RACE_STATS.map((x) => [x, { wins: Number(r[`${x}_wins`]) || 0, losses: Number(r[`${x}_losses`]) || 0 }])
			) as Details['races']
		}
	};
}

async function set(user: string, key: string, value: string) {
	const reply = (await pvpgn.run(`/set ${user} ${key} ${value}`)).join('\n');
	return /Key set successfully/.test(reply) ? null : reply.replace(/^ERROR: /gm, '');
}

/** Apply only changed values. Slow-ish: bnetd's flood quota allows ~4 commands / 5s. */
export async function updatePlayer(p: Player, stats: Partial<Stats>, icon: string | null) {
	if (pvpgn.state !== 'ready') return { ok: false, message: 'pvpgn offline' };
	const errors: string[] = [];
	let n = 0;
	for (const c of COLS) {
		const v = stats[c];
		if (v === undefined || v === p.stats[c]) continue;
		const err = await set(p.username, `Record\\W3XP\\${c}`, String(Math.max(0, Math.floor(v))));
		if (err) errors.push(`${c}: ${err}`);
		else n++;
	}
	if (icon !== null && icon !== p.icon) {
		const err = await set(p.username, 'Record\\W3XP\\userselected_icon', icon || 'null');
		if (err) errors.push(`icon: ${err}`);
		else n++;
	}
	if (errors.length) return { ok: false, message: errors.join('\n') };
	return { ok: true, message: n ? `Updated ${n} value${n > 1 ? 's' : ''}.` : 'Nothing changed.' };
}
