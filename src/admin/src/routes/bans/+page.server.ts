import { fields, respond } from '$lib/server/actions';
import { ipBan, ipUnban, lock, mute, unlock, unmute } from '$lib/server/pvpgn/commands';
import { ipBans, lockedAccounts, mutedAccounts } from '$lib/server/pvpgn/bans';
import { syncAccounts } from '$lib/server/pvpgn/sync';

export const load = async () => {
	await syncAccounts(true);
	const [ips, locked, muted] = await Promise.all([
		ipBans().catch(() => null),
		lockedAccounts().catch(() => null),
		mutedAccounts().catch(() => null)
	]);
	return { ips, locked, muted };
};

export const actions = {
	ipban: async ({ request }) => {
		const f = await fields(request);
		return respond('ipban', await ipBan(f.str('ip'), f.num('minutes')));
	},
	ipunban: async ({ request }) => respond('ipban', await ipUnban((await fields(request)).str('ip'))),
	lock: async ({ request }) => {
		const f = await fields(request);
		return respond('lock', await lock(f.str('user'), f.num('hours'), f.str('reason')));
	},
	unlock: async ({ request }) => respond('lock', await unlock((await fields(request)).str('user'))),
	mute: async ({ request }) => {
		const f = await fields(request);
		return respond('mute', await mute(f.str('user'), f.num('hours'), f.str('reason')));
	},
	unmute: async ({ request }) => respond('mute', await unmute((await fields(request)).str('user')))
};
