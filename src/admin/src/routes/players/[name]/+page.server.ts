import { error } from '@sveltejs/kit';
import { respond } from '$lib/server/actions';
import { FIELDS, LADDERS, MAX_STATS, getPlayer, updatePlayer, type Stats } from '$lib/server/pvpgn/ladder';
import { readStatus } from '$lib/server/pvpgn/status';
import { syncAccounts } from '$lib/server/pvpgn/sync';

export const load = async ({ params }) => {
	await syncAccounts(true);
	const player = await getPlayer(params.name);
	if (!player) error(404, `No account named ${params.name}`);
	const status = await readStatus();
	const u = status?.users.find((x) => x.name.toLowerCase() === player.username.toLowerCase());
	const online = u && {
		country: u.country || null,
		clienttag: u.clienttag,
		version: u.version,
		game: u.gameid ? (status?.games.find((g) => g.id === u.gameid)?.name ?? `#${u.gameid}`) : null
	};
	return { player, online: online ?? null, ladders: LADDERS, fields: FIELDS, max: MAX_STATS };
};

export const actions = {
	default: async ({ params, request }) => {
		const player = await getPlayer(params.name);
		if (!player) error(404, 'no such account');
		const d = await request.formData();
		const stats: Partial<Stats> = {};
		for (const l of LADDERS)
			for (const f of FIELDS) {
				const v = d.get(`${l}_${f}`);
				if (v !== null && v !== '') stats[`${l}_${f}`] = Number(v);
			}
		const icon = d.get('icon');
		return respond('player', await updatePlayer(player, stats, icon === null ? null : String(icon)));
	}
};
