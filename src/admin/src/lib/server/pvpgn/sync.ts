// bnetd caches accounts and writes them to MySQL every `usersync` (300s).
// /save flushes now; call before reading account state from the DB.
import { pvpgn } from './telnet';

const MIN_GAP_MS = 15_000;
let last = 0;
let inflight: Promise<void> | null = null;

/** `force` skips the throttle, e.g. right after an account change. */
export function syncAccounts(force = false): Promise<void> {
	if (pvpgn.state !== 'ready' || (!force && Date.now() - last < MIN_GAP_MS)) return Promise.resolve();
	inflight ??= pvpgn
		.run('/save')
		.then(() => void (last = Date.now()))
		.catch(() => {})
		.finally(() => (inflight = null));
	return inflight;
}
