import { auraDb } from './aura/db';
import { ping } from './pvpgn/db';
import { readStatus } from './pvpgn/status';
import { pvpgn } from './pvpgn/telnet';

export async function health() {
	// kick off (re)connect without blocking page loads
	if (pvpgn.state === 'disconnected') pvpgn.connect().catch(() => {});
	const [dbOk, status] = await Promise.all([ping(), readStatus().catch(() => null)]);
	let auraOk = false;
	try {
		auraOk = auraDb() !== null;
	} catch {}
	return {
		telnet: { state: pvpgn.state, error: pvpgn.lastError },
		db: dbOk,
		statusAgeS: status ? Math.round((Date.now() - status.updatedAt.getTime()) / 1000) : null,
		auraDb: auraOk
	};
}
