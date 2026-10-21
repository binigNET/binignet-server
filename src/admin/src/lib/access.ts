// Who may see what (shared: hooks enforce it, layouts hide what's off-limits).
// Admins: everything. Players (pvpgn accounts): WC3 games + the HLDS server pages.
import { GAME_IDS } from '$lib/games';

export type Role = 'admin' | 'player';
export type User = { name: string; role: Role };

/** player pages → form actions they may post */
const PLAYER: Record<string, string[]> = {
	'/games': ['host', 'unhost', 'owner'],
	// say/kick/ban and savebots (persistent server cfg) stay admin-only
	...Object.fromEntries(GAME_IDS.map((g) => [`/${g}`, ['restart', 'map', 'kickbots', 'readdbots', 'addbots', 'botskill']])),
	'/logout': []
};

export const home = (role: Role) => (role === 'admin' ? '/' : '/games');

/** `action` is the `?/name` of a form action; '' for a page load or plain POST */
export function canAccess(role: Role, path: string, action?: string): boolean {
	if (role === 'admin') return true;
	const actions = PLAYER[path];
	return !!actions && (!action || actions.includes(action));
}

/** form action name from a request URL (`/cs?/map` → 'map') */
export const actionOf = (url: URL) => [...url.searchParams.keys()].find((k) => k.startsWith('/'))?.slice(1) ?? '';
