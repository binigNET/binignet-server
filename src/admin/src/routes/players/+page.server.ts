import { fields, respond } from '$lib/server/actions';
import { DELETED_REASON, addAccount } from '$lib/server/pvpgn/commands';
import { listAccounts, type Account } from '$lib/server/pvpgn/db';
import { config } from '$lib/server/env';
import { readStatus } from '$lib/server/pvpgn/status';

const PER_PAGE = 15;

export type PlayerRow = {
	name: string;
	online: boolean;
	bot: boolean;
	deleted: boolean;
	clienttag: string | null;
	game: string | null;
	lastLogin: Date | null;
};

export const load = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	let dbError = '';
	const [status, accounts] = await Promise.all([
		readStatus(),
		listAccounts().catch((e: Error) => {
			dbError = e.message;
			return [] as Account[];
		})
	]);

	const me = config.pvpgn().user.toLowerCase();
	const bot = config.auraBot().toLowerCase();
	const gameNames = new Map(status?.games.map((g) => [g.id, g.name]));
	const online = new Map(
		(status?.users ?? []).map((u) => [
			u.name.toLowerCase(),
			{ name: u.name, clienttag: u.clienttag, game: u.gameid ? (gameNames.get(u.gameid) ?? `#${u.gameid}`) : null }
		])
	);

	// every account, plus online users the DB didn't return (e.g. DB down)
	const byName = new Map<string, PlayerRow>();
	for (const a of accounts) {
		const key = a.username.toLowerCase();
		const o = online.get(key);
		const deleted = a.locked && a.lockReason === DELETED_REASON;
		byName.set(key, { name: a.username, online: !!o, bot: key === bot, deleted, clienttag: o?.clienttag ?? null, game: o?.game ?? null, lastLogin: a.lastLogin });
	}
	for (const [key, o] of online)
		if (!byName.has(key)) byName.set(key, { name: o.name, online: true, bot: key === bot, deleted: false, clienttag: o.clienttag, game: o.game, lastLogin: null });
	byName.delete(me);

	const all = [...byName.values()];
	// bot, online, offline, deleted
	const rank = (r: PlayerRow) => (r.bot ? 0 : r.deleted ? 3 : r.online ? 1 : 2);
	const rows = all
		.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()))
		.sort(
			(a, b) =>
				rank(a) - rank(b) ||
				// offline: most recent login first, never logged in last
				(rank(a) === 2 ? (b.lastLogin?.getTime() ?? -1) - (a.lastLogin?.getTime() ?? -1) : 0) ||
				a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
		);

	const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
	const page = Math.min(pages, Math.max(1, Number(url.searchParams.get('page')) || 1));
	return {
		rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
		page,
		pages,
		total: rows.length,
		accounts: all.length,
		online: all.filter((r) => r.online && !r.bot).length,
		q,
		updatedAt: status?.updatedAt ?? null,
		dbError
	};
};

export const actions = {
	create: async ({ request }) => {
		const f = await fields(request);
		return respond('create', await addAccount(f.str('user'), f.str('password')));
	}
};
