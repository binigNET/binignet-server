import { fields, respond } from '$lib/server/actions';
import { addBots, changeMap, kickBots, mapList, players, reAddBots, restart } from '$lib/server/hlds/commands';
import { GAME_DEFS } from '$lib/server/hlds/games';

export const load = async ({ params }) => {
	const def = GAME_DEFS[params.game];
	const [p, maps] = await Promise.all([players(params.game), mapList(params.game)]);
	return { ...p, maps, restartLabel: def.restart.label, defaultBots: def.defaultBots };
};

export const actions = {
	restart: async ({ params }) => respond('restart', await restart(params.game)),
	map: async ({ params, request }) => {
		const f = await fields(request);
		return respond('map', await changeMap(params.game, f.str('custom') || f.str('map')));
	},
	kickbots: async ({ params }) => respond('bots', await kickBots(params.game)),
	readdbots: async ({ params }) => respond('bots', await reAddBots(params.game)),
	addbots: async ({ params, request }) => respond('bots', await addBots(params.game, (await fields(request)).num('n')))
};
