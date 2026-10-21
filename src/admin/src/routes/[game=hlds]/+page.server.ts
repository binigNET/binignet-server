import { fail } from '@sveltejs/kit';
import type { GameId } from '$lib/games';
import { fields, respond } from '$lib/server/actions';
import type { Result } from '$lib/server/pvpgn/commands';
import {
	addBots,
	ban,
	botSettings,
	changeMap,
	kick,
	kickBots,
	mapList,
	reAddBots,
	restart,
	saveBotDefaults,
	say,
	setBotSkill,
	type BanType,
	type SayMode
} from '$lib/server/hlds/commands';
import { GAME_DEFS } from '$lib/server/hlds/games';

// players may restart / change map once per 30s per game (admins: no limit)
const COOLDOWN_MS = 30_000;
const lastPlayerChange = new Map<GameId, number>();

async function limited(game: GameId, locals: App.Locals, form: string, run: () => Promise<Result>) {
	const player = locals.user?.role !== 'admin';
	const wait = player ? (lastPlayerChange.get(game) ?? 0) + COOLDOWN_MS - Date.now() : 0;
	if (wait > 0) return fail(429, { form, ok: false, message: `Wait ${Math.ceil(wait / 1000)}s before another restart/map change` });
	const r = await run();
	if (player && r.ok) lastPlayerChange.set(game, Date.now());
	return respond(form, r);
}

// players come from the layout's (shared) `status` call; `maps` is streamed
export const load = async ({ params }) => ({
	maps: mapList(params.game),
	botCfg: await botSettings(params.game),
	restartLabel: GAME_DEFS[params.game].restart.label
});

export const actions = {
	restart: async ({ params, locals }) => limited(params.game, locals, 'restart', () => restart(params.game)),
	map: async ({ params, request, locals }) => {
		const f = await fields(request);
		return limited(params.game, locals, 'map', () => changeMap(params.game, f.str('custom') || f.str('map')));
	},
	kickbots: async ({ params }) => respond('bots', await kickBots(params.game)),
	readdbots: async ({ params }) => respond('bots', await reAddBots(params.game)),
	addbots: async ({ params, request }) => respond('bots', await addBots(params.game, (await fields(request)).num('n'))),
	botskill: async ({ params, request }) => respond('bots', await setBotSkill(params.game, (await fields(request)).num('skill'))),
	savebots: async ({ params, request }) => {
		const f = await fields(request);
		return respond('bots', await saveBotDefaults(params.game, f.num('bots'), f.num('skill')));
	},
	say: async ({ params, request }) => {
		const f = await fields(request);
		return respond('say', await say(params.game, f.str('msg'), f.str('mode') as SayMode));
	},
	kick: async ({ params, request }) => {
		const f = await fields(request);
		return respond('player', await kick(params.game, f.num('userid'), f.str('reason')));
	},
	ban: async ({ params, request }) => {
		const f = await fields(request);
		const p = { userid: f.num('userid'), uniqueid: f.str('uniqueid'), ip: f.str('ip') };
		return respond('player', await ban(params.game, p, f.str('type') as BanType, f.num('hours') * 60, f.str('reason')));
	}
};
