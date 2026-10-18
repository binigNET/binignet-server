import { fields, respond } from '$lib/server/actions';
import {
	addBots,
	ban,
	changeMap,
	kick,
	kickBots,
	mapList,
	players,
	reAddBots,
	restart,
	say,
	type BanType,
	type SayMode
} from '$lib/server/hlds/commands';
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
	addbots: async ({ params, request }) => respond('bots', await addBots(params.game, (await fields(request)).num('n'))),
	say: async ({ params, request }) => {
		const f = await fields(request);
		return respond('say', await say(params.game, f.str('msg'), f.str('mode') as SayMode));
	},
	kick: async ({ params, request }) => {
		const f = await fields(request);
		return respond('player', await kick(params.game, f.num('userid'), f.str('reason')));
	},
	ban: async ({ params, request }) => {
		const f = await fields(request);
		const p = { userid: f.num('userid'), uniqueid: f.str('uniqueid'), ip: f.str('ip') };
		return respond('player', await ban(params.game, p, f.str('type') as BanType, f.num('hours') * 60, f.str('reason')));
	}
};
