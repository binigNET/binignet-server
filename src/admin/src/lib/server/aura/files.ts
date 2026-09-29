// aura data dir (./aura/data): maps, mapcfgs, aura.log.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../env';

export const auraPath = (...p: string[]) => path.join(config.paths.aura, ...p);
export const mapsDir = () => auraPath('maps');
export const mapcfgsDir = () => auraPath('mapcfgs');

export type MapFile = { name: string; size: number; mtime: Date };

export async function listMaps(): Promise<MapFile[]> {
	const names = (await readdir(mapsDir())).filter((n) => /\.w3[xm]$/i.test(n));
	const maps = await Promise.all(
		names.map(async (name) => {
			const st = await stat(path.join(mapsDir(), name));
			return { name, size: st.size, mtime: st.mtime };
		})
	);
	return maps.sort((a, b) => a.name.localeCompare(b.name));
}
