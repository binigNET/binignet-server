import { auraGames, type AuraGame } from '$lib/server/aura/games';
import { readStatus } from '$lib/server/pvpgn/status';

export const load = async () => {
	const status = await readStatus();
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
		updatedAt: status?.updatedAt ?? null,
		auraError,
		// aura games w/ matching pvpgn listing (by name), then games not hosted by aura
		games: [
			...aura.map((a) => ({ aura: a, pvpgn: pvpgnGames.find((g) => g.name === a.name) ?? null })),
			...pvpgnGames.filter((g) => !aura.some((a) => a.name === g.name)).map((g) => ({ aura: null, pvpgn: g }))
		]
	};
};
