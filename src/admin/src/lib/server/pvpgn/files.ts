// Admin-editable pvpgn files, shared via ./pvpgn/admin (see entrypoint.sh).
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../env';

export const adminPath = (...p: string[]) => path.join(config.paths.pvpgnAdmin, ...p);

export const files = {
	motd: () => adminPath('i18n', 'bnmotd.txt'),
	news: () => adminPath('i18n', 'news.txt'),
	ads: () => adminPath('ad.json'),
	bans: () => adminPath('bnban.conf'),
	icons: () => adminPath('icons.conf'),
	filedir: () => adminPath('files')
};

export const readText = (file: string) => readFile(file, 'latin1');

/** Write via tmp + rename so bnetd never reads a half-written file. */
export async function writeAtomic(file: string, data: string | Buffer) {
	const tmp = `${file}.${process.pid}.tmp`;
	await writeFile(tmp, data);
	await rename(tmp, file);
}
