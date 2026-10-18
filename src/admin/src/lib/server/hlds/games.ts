// Per-game command differences: CS runs YaPB bots, HLDM runs jk_botti.
import path from 'node:path';
import type { GameId } from '$lib/games';
import { config } from '../env';

type Def = {
	restart: { cmd: string; label: string };
	/** commands to remove every bot and keep them out */
	kickBots: string[];
	/** commands to go from `current` bots to `target` bots */
	addBots: (current: number, target: number) => string[];
	defaultBots: number;
	/** maps hidden from the change-map list */
	hideMaps?: RegExp;
	dataDir: () => string;
};

export const GAME_DEFS: Record<GameId, Def> = {
	cs: {
		restart: { cmd: 'sv_restart 1', label: 'Restart round' },
		// yapb refills to yb_quota, so drop the quota first
		kickBots: ['yb_quota 0', 'yb kickall'],
		addBots: (_current, target) => [`yb_quota ${target}`],
		defaultBots: 6,
		dataDir: () => config.paths.cs
	},
	hldm: {
		restart: { cmd: 'restart', label: 'Restart map' },
		kickBots: ['jk_botti kickall'],
		addBots: (current, target) => Array.from({ length: Math.max(0, target - current) }, () => 'jk_botti addbot'),
		defaultBots: 4,
		// single-player campaign / training maps
		hideMaps: /^(c\d|t0)/,
		dataDir: () => config.paths.hldm
	}
};

export const dataPath = (game: GameId, ...p: string[]) => path.join(GAME_DEFS[game].dataDir(), ...p);
