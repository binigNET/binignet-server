import { error } from '@sveltejs/kit';
import { respond } from '$lib/server/actions';
import { FIELDS, LADDERS, MAX_STATS, getPlayer, updatePlayer, type Stats } from '$lib/server/pvpgn/ladder';
import { syncAccounts } from '$lib/server/pvpgn/sync';

export const load = async ({ params }) => {
	await syncAccounts(true);
	const player = await getPlayer(params.name);
	if (!player) error(404, `No account named ${params.name}`);
	return { player, ladders: LADDERS, fields: FIELDS, max: MAX_STATS };
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
