// Per-player WC3 ladder stats + icon. Read from MySQL (after /save), write via /set.
// AT stats are per team (pvpgn_arrangedteam) and not editable here.
import { db, table } from './db';
import { files, readText } from './files';
import { pvpgn } from './telnet';

export const LADDERS = ['solo', 'team', 'ffa'] as const;
export const FIELDS = ['level', 'xp', 'wins', 'losses'] as const;
export type Stats = Record<`${(typeof LADDERS)[number]}_${(typeof FIELDS)[number]}`, number>;
export type Player = { uid: number; username: string; stats: Stats; icon: string };
export type Icon = { code: string; name: string };

const COLS = LADDERS.flatMap((l) => FIELDS.map((f) => `${l}_${f}` as keyof Stats));

export async function getPlayer(name: string): Promise<Player | null> {
	const [rows] = await db().query(
		`SELECT b.uid, b.username, ${COLS.map((c) => `r.W3XP_${c} AS ${c}`).join(', ')}, r.W3XP_userselected_icon AS icon
		 FROM ${table('BNET')} b LEFT JOIN ${table('Record')} r ON r.uid = b.uid
		 WHERE b.uid > 0 AND LOWER(b.username) = LOWER(?)`,
		[name]
	);
	const r = (rows as Record<string, unknown>[])[0];
	if (!r) return null;
	return {
		uid: Number(r.uid),
		username: String(r.username),
		stats: Object.fromEntries(COLS.map((c) => [c, Number(r[c]) || 0])) as Stats,
		icon: r.icon ? String(r.icon) : ''
	};
}

/** Icons from icons.conf [icons] section: `<index> <name> <code>` */
export async function iconChoices(): Promise<Icon[]> {
	const text = await readText(files.icons()).catch(() => '');
	const section = /\[icons\]([\s\S]*?)\[\/icons\]/.exec(text)?.[1] ?? '';
	return section
		.split(/\r?\n/)
		.map((l) => l.replace(/#.*/, '').trim().split(/\s+/))
		.filter((p) => p.length >= 3)
		.map((p) => ({ name: p.slice(1, -1).join(' '), code: p[p.length - 1] }));
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
