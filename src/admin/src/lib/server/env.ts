import { env } from '$env/dynamic/private';
import type { GameId } from '$lib/games';

function req(name: string): string {
	const v = env[name];
	if (!v) throw new Error(`${name} not set`);
	return v;
}

const HLDS_PORTS: Record<GameId, number> = { cs: 27015, hldm: 27016 };

export const config = {
	adminPassword: () => req('ADMIN_PASSWORD'),
	db: () => ({
		host: env.DB_HOST || 'pvpgn-db',
		database: env.DB_NAME || 'bnetd',
		user: env.DB_USER || 'bnetd',
		password: env.DB_PASS || 'secret',
		prefix: env.DB_PREFIX || 'pvpgn_'
	}),
	pvpgn: () => ({
		host: env.PVPGN_HOST || 'pvpgn',
		port: Number(env.PVPGN_TELNET_PORT || 23),
		user: req('PVPGN_ADMIN_USER'),
		pass: req('PVPGN_ADMIN_PASS')
	}),
	auraBot: () => env.AURA_BOT || 'bot',
	dockerApi: () => env.DOCKER_API || 'http://docker-proxy:2375',
	// empty password = rcon disabled (status still works via A2S)
	hlds: (game: GameId) => {
		const p = game.toUpperCase();
		return {
			host: env[`${p}_HOST`] || game,
			port: Number(env[`${p}_PORT`] || HLDS_PORTS[game]),
			password: env[`${p}_RCON_PASSWORD`] || ''
		};
	},
	paths: {
		pvpgnAdmin: env.PVPGN_ADMIN_DIR || '/data/pvpgn-admin',
		pvpgnStatus: env.PVPGN_STATUS_DIR || '/data/pvpgn-status',
		aura: env.AURA_DATA_DIR || '/data/aura',
		cs: env.CS_DATA_DIR || '/data/cs',
		hldm: env.HLDM_DATA_DIR || '/data/hldm'
	}
};
