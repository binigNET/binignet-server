import { accountCount } from '$lib/server/pvpgn/db';
import { config } from '$lib/server/env';
import { readStatus } from '$lib/server/pvpgn/status';

export const load = async () => {
	const [status, accounts] = await Promise.all([readStatus(), accountCount().catch(() => null)]);
	const gameNames = new Map(status?.games.map((g) => [g.id, g.name]));
	return {
		updatedAt: status?.updatedAt ?? null,
		accounts,
		// hide the dashboard's own telnet session
		users: (status?.users ?? [])
			.filter((u) => u.name.toLowerCase() !== config.pvpgn().user.toLowerCase())
			.map((u) => ({
				...u,
				game: u.gameid ? (gameNames.get(u.gameid) ?? `#${u.gameid}`) : null
			}))
	};
};
