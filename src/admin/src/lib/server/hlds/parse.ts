// Parsers for HLDS console output (rcon replies).

export type Player = {
	userid: number;
	name: string;
	uniqueid: string;
	frags: number;
	time: string;
	ping: number;
	loss: number;
	addr: string;
	bot: boolean;
};

// # <slot> "<name>" <userid> <uniqueid> <frag> <time> <ping> <loss> [<adr>]
const STATUS_RE = /^#\s*\d+\s+"(.*)"\s+(\d+)\s+(\S+)\s+(-?\d+)\s+([\d:]+)\s+(\d+)\s+(\d+)(?:\s+(\S+))?\s*$/;

export function parseStatus(out: string): Player[] {
	const players: Player[] = [];
	for (const line of out.split('\n')) {
		const m = STATUS_RE.exec(line.trim());
		if (!m) continue;
		players.push({
			name: m[1],
			userid: Number(m[2]),
			uniqueid: m[3],
			frags: Number(m[4]),
			time: m[5],
			ping: Number(m[6]),
			loss: Number(m[7]),
			addr: m[8] ?? '',
			bot: m[3] === 'BOT'
		});
	}
	return players;
}

/** `maps *` → sorted unique map names */
export function parseMaps(out: string): string[] {
	const names = new Set<string>();
	for (const m of out.matchAll(/([\w.+-]+)\.bsp\b/g)) names.add(m[1]);
	return [...names].sort();
}

/** mapcycle.txt → map names in order (comments/blank lines skipped) */
export function parseMapcycle(text: string): string[] {
	return text
		.split('\n')
		.map((l) => l.replace(/\/\/.*/, '').trim().split(/\s+/)[0])
		.filter(Boolean);
}

export type Ban = { id: string; expires: string };

/** `listid` / `listip` → entries ("permanent" or "<n> min"). listip pads octets ("  9.  9..."). */
export function parseBanList(out: string): Ban[] {
	const bans: Ban[] = [];
	for (const line of out.split('\n')) {
		const m = /^(?:\d+\s+(\S+)|([\d.\s]+?))\s*:\s*(permanent|[\d.]+ min)/.exec(line.trim());
		if (!m) continue;
		const id = m[1] ?? m[2].replace(/\s/g, '');
		const expires = m[3] === 'permanent' ? 'permanent' : `${Math.round(parseFloat(m[3]))} min`;
		bans.push({ id, expires });
	}
	return bans;
}
