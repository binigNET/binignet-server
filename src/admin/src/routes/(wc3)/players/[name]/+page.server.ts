import { error } from '@sveltejs/kit';
import { fields, respond } from '$lib/server/actions';
import { DELETED_REASON, chpass, kill, lock, mute, softDelete, unlock, unmute } from '$lib/server/pvpgn/commands';
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
	const deleted = player.details.locked && player.details.lockReason === DELETED_REASON;
	return { player, deleted, online: online ?? null, ladders: LADDERS, fields: FIELDS, max: MAX_STATS };
};

/** canonical account name, so commands target the real account */
async function username(name: string) {
	const p = await getPlayer(name);
	if (!p) error(404, 'no such account');
	return p.username;
}

export const actions = {
	save: async ({ params, request }) => {
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
	},
	kick: async ({ params, request }) => {
		const f = await fields(request);
		return respond('kick', await kill(await username(params.name), f.num('minutes') || null));
	},
	lock: async ({ params, request }) => {
		const f = await fields(request);
		return respond('lock', await lock(await username(params.name), f.num('hours'), f.str('reason')));
	},
	unlock: async ({ params }) => respond('lock', await unlock(await username(params.name))),
	mute: async ({ params, request }) => {
		const f = await fields(request);
		return respond('mute', await mute(await username(params.name), f.num('hours'), f.str('reason')));
	},
	unmute: async ({ params }) => respond('mute', await unmute(await username(params.name))),
	chpass: async ({ params, request }) => respond('chpass', await chpass(await username(params.name), (await fields(request)).str('password'))),
	delete: async ({ params }) => respond('delete', await softDelete(await username(params.name)))
};
