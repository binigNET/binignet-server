// Per-game command differences: CS runs YaPB bots, HLDM runs jk_botti.
import path from 'node:path';
import type { GameId } from '$lib/games';
import { config } from '../env';
import { getLine, jkBotDefaults, readCfg, setJkBotDefaults, setLine, writeCfg } from './cfg';

const YAPB_CFG = 'addons/yapb/conf/yapb.cfg';

export type Cvar = {
	name: string;
	label: string;
	/** int/float range, or 'bool' (0/1), or 'text' */
	type: { min: number; max: number; float?: boolean } | 'bool' | 'text';
};

type BotSkill = { cvar: (n: number) => string; min: number; max: number; hint: string };

type Def = {
	restart: { cmd: string; label: string };
	/** commands to remove every bot and keep them out */
	kickBots: string[];
	/** commands to go from `current` bots to `target` bots */
	addBots: (current: number, target: number) => string[];
	bots: {
		skill: BotSkill;
		/** saved defaults (cfg file) */
		readDefaults: () => Promise<{ bots: number; skill: number }>;
		saveDefaults: (bots: number, skill: number) => Promise<void>;
	};
	cvars: Cvar[];
	/** cfg run on start / map change that holds saved cvar defaults */
	cvarFile: () => string;
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
		bots: {
			skill: { cvar: (n) => `yb_difficulty ${n}`, min: 0, max: 4, hint: '0 newbie – 4 expert' },
			readDefaults: async () => {
				const t = await readCfg(dataPath('cs', YAPB_CFG));
				return { bots: Number(getLine(t, 'yb_quota') ?? 6), skill: Number(getLine(t, 'yb_difficulty') ?? 3) };
			},
			saveDefaults: async (bots, skill) => {
				const f = dataPath('cs', YAPB_CFG);
				await writeCfg(f, setLine(setLine(await readCfg(f), 'yb_quota', String(bots)), 'yb_difficulty', String(skill)));
			}
		},
		cvars: [
			{ name: 'mp_timelimit', label: 'Time limit (min)', type: { min: 0, max: 999 } },
			{ name: 'mp_maxrounds', label: 'Max rounds', type: { min: 0, max: 999 } },
			{ name: 'mp_roundtime', label: 'Round time (min)', type: { min: 1, max: 9, float: true } },
			{ name: 'mp_freezetime', label: 'Freeze time (s)', type: { min: 0, max: 60 } },
			{ name: 'mp_c4timer', label: 'C4 timer (s)', type: { min: 10, max: 90 } },
			{ name: 'mp_startmoney', label: 'Start money', type: { min: 800, max: 16000 } },
			{ name: 'mp_friendlyfire', label: 'Friendly fire', type: 'bool' },
			{ name: 'mp_autoteambalance', label: 'Auto team balance', type: 'bool' },
			{ name: 'sv_gravity', label: 'Gravity', type: { min: 0, max: 2000 } },
			{ name: 'sv_password', label: 'Join password', type: 'text' }
		],
		cvarFile: () => dataPath('cs', 'server-custom.cfg'),
		dataDir: () => config.paths.cs
	},
	hldm: {
		restart: { cmd: 'restart', label: 'Restart map' },
		kickBots: ['jk_botti kickall'],
		addBots: (current, target) => Array.from({ length: Math.max(0, target - current) }, () => 'jk_botti addbot'),
		bots: {
			// botskill only applies to bots added after it
			skill: { cvar: (n) => `jk_botti botskill ${n}`, min: 1, max: 5, hint: '1 best – 5 worst, new bots only' },
			readDefaults: async () => jkBotDefaults(await readCfg(dataPath('hldm', 'jk_botti.cfg'))),
			saveDefaults: async (bots, skill) => {
				const f = dataPath('hldm', 'jk_botti.cfg');
				await writeCfg(f, setJkBotDefaults(await readCfg(f), bots, skill));
			}
		},
		cvars: [
			{ name: 'mp_timelimit', label: 'Time limit (min)', type: { min: 0, max: 999 } },
			{ name: 'mp_fraglimit', label: 'Frag limit', type: { min: 0, max: 999 } },
			{ name: 'mp_friendlyfire', label: 'Friendly fire', type: 'bool' },
			{ name: 'mp_weaponstay', label: 'Weapon stay', type: 'bool' },
			{ name: 'mp_falldamage', label: 'Realistic fall damage', type: 'bool' },
			{ name: 'sv_gravity', label: 'Gravity', type: { min: 0, max: 2000 } },
			{ name: 'sv_password', label: 'Join password', type: 'text' }
		],
		// runs on every map change (mapchangecfgfile server.cfg)
		cvarFile: () => dataPath('hldm', 'config', 'server.cfg'),
		// single-player campaign / training maps
		hideMaps: /^(c\d|t0)/,
		dataDir: () => config.paths.hldm
	}
};

export const dataPath = (game: GameId, ...p: string[]) => path.join(GAME_DEFS[game].dataDir(), ...p);
