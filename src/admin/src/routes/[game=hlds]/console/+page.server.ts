import { fields, respond } from '$lib/server/actions';
import { raw } from '$lib/server/hlds/commands';

export const actions = {
	default: async ({ params, request }) => respond('console', await raw(params.game, (await fields(request)).str('cmd')))
};
