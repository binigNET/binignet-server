import { fields, respond } from '$lib/server/actions';
import { cvars, saveCvar, setCvar } from '$lib/server/hlds/commands';

export const load = async ({ params }) => cvars(params.game);

export const actions = {
	apply: async ({ params, request }) => {
		const f = await fields(request);
		return respond('cvar', await setCvar(params.game, f.str('name'), f.raw('value')));
	},
	save: async ({ params, request }) => {
		const f = await fields(request);
		return respond('cvar', await saveCvar(params.game, f.str('name'), f.raw('value')));
	}
};
