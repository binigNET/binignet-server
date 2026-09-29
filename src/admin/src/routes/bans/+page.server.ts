import { ipBans, lockedAccounts, mutedAccounts } from '$lib/server/pvpgn/bans';
import { syncAccounts } from '$lib/server/pvpgn/sync';

export const load = async () => {
	await syncAccounts();
	const [ips, locked, muted] = await Promise.all([
		ipBans().catch(() => null),
		lockedAccounts().catch(() => null),
		mutedAccounts().catch(() => null)
	]);
	return { ips, locked, muted };
};
