import { fields, respond } from '$lib/server/actions';
import { auraGames, giveOwner, hostable, hostGame, unhostLobby, type AuraGame } from '$lib/server/aura/games';
import { readStatus } from '$lib/server/pvpgn/status';

export const load = async ({ url }) => {
	const [status, maps] = await Promise.all([readStatus(), hostable()]);
	let aura: AuraGame[] = [];
	let auraError = '';
	try {
		aura = await auraGames();
	} catch (e) {
		auraError = (e as Error).message;
	}
	const players = (id: number) => (status?.users ?? []).filter((u) => u.gameid === id).map((u) => u.name);
	const pvpgnGames = (status?.games ?? []).map((g) => ({ ...g, players: players(g.id) }));
	return {
		hostable: maps,
		prefillMap: url.searchParams.get('map') ?? '',
		updatedAt: status?.updatedAt ?? null,
		auraError,
		// aura games w/ matching pvpgn listing (by name), then games not hosted by aura
		games: [
			...aura.map((a) => ({ aura: a, pvpgn: pvpgnGames.find((g) => g.name === a.name) ?? null })),
			...pvpgnGames.filter((g) => !aura.some((a) => a.name === g.name)).map((g) => ({ aura: null, pvpgn: g }))
		]
	};
};

export const actions = {
	unhost: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		return respond('unhost', await unhostLobby(id));
	},
	host: async ({ request }) => {
		const f = await fields(request);
		return respond('host', await hostGame({ map: f.str('map'), name: f.str('name'), priv: f.str('visibility') === 'private' }));
	},
	owner: async ({ request }) => respond('owner', await giveOwner((await fields(request)).str('user')))
};
