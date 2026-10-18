// HLDS game servers the dashboard controls (shared: used by the route param matcher).
export const HLDS_GAMES = {
	cs: { label: 'CS 1.6', name: 'Counter-Strike 1.6' },
	hldm: { label: 'HLDM', name: 'Half-Life Deathmatch' }
} as const;

export type GameId = keyof typeof HLDS_GAMES;
export const GAME_IDS = Object.keys(HLDS_GAMES) as GameId[];
export const isGame = (s: string): s is GameId => Object.hasOwn(HLDS_GAMES, s);
