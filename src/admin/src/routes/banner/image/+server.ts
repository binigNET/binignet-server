import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { files } from '$lib/server/pvpgn/files';

// preview of a banner file from filedir (png only)
export const GET = async ({ url }) => {
	const name = url.searchParams.get('name') ?? '';
	if (!/^[\w.-]+\.png$/i.test(name)) error(400, 'bad name');
	const data = await readFile(path.join(files.filedir(), name)).catch(() => null);
	if (!data) error(404, 'not found');
	return new Response(new Uint8Array(data), { headers: { 'content-type': 'image/png', 'cache-control': 'no-store' } });
};
