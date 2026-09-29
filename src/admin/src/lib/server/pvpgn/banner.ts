// Single WC3 banner slot: the W3XP entry in ad.json + its PNG in filedir.
// ad.json filenames must be plain names inside filedir ("Paths are not supported").
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { files, readText, writeAtomic } from './files';
import { pvpgn } from './telnet';

type Ad = { filename: string; url: string; client: string; lang: string };
export type Banner = { filename: string; url: string } | null;

export const MAX_BANNER_BYTES = 256 * 1024;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function readAds(): Promise<Ad[]> {
	return JSON.parse(await readText(files.ads())).ads ?? [];
}

export async function getBanner(): Promise<Banner> {
	const ad = (await readAds()).find((a) => a.client === 'W3XP');
	return ad ? { filename: ad.filename, url: ad.url } : null;
}

export async function setBanner(png: Buffer | null, url: string): Promise<{ ok: boolean; message: string }> {
	if (!/^https?:\/\/\S+$/.test(url)) return { ok: false, message: 'URL must start with http:// or https://' };
	const current = await getBanner();
	let filename = current?.filename;
	if (png) {
		if (!png.subarray(0, 8).equals(PNG)) return { ok: false, message: 'banner must be a PNG' };
		if (png.length > MAX_BANNER_BYTES) return { ok: false, message: 'banner larger than 256 KB' };
		// new name per upload: WC3 caches banners by file name
		filename = `banner${Date.now()}.png`;
		await writeAtomic(path.join(files.filedir(), filename), png);
	}
	if (!filename) return { ok: false, message: 'upload an image first' };
	const others = (await readAds()).filter((a) => a.client !== 'W3XP');
	const ads = [{ filename, url, client: 'W3XP', lang: 'NULL' }, ...others];
	await writeAtomic(files.ads(), JSON.stringify({ ads }, null, '\t') + '\n');
	if (pvpgn.state !== 'ready') return { ok: false, message: 'saved, but pvpgn offline: not reloaded' };
	const reply = (await pvpgn.run('/rehash banners')).join('\n');
	if (!/is complete/.test(reply)) return { ok: false, message: `saved, reload failed: ${reply}` };
	// drop banners no longer referenced
	for (const f of await readdir(files.filedir())) {
		if (/^banner\d+\.png$/.test(f) && f !== filename) await unlink(path.join(files.filedir(), f)).catch(() => {});
	}
	return { ok: true, message: 'Banner saved and reloaded.' };
}
