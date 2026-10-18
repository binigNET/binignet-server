import { fields, respond } from '$lib/server/actions';
import { bans, unban } from '$lib/server/hlds/commands';

export const load = async ({ params }) => bans(params.game);

export const actions = {
	unban: async ({ params, request }) => respond('unban', await unban(params.game, (await fields(request)).str('id')))
};
