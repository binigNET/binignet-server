import { fail } from '@sveltejs/kit';
import { listMaps } from '$lib/server/aura/files';
import { MAX_MAP_BYTES, deleteMap, renameMap, uploadMap } from '$lib/server/aura/maps';
import { respond } from '$lib/server/actions';

export const load = async () => ({ maps: await listMaps().catch(() => []), maxBytes: MAX_MAP_BYTES });

export const actions = {
	upload: async ({ request }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || !file.size) return fail(400, { form: 'upload', ok: false, message: 'choose a map file' });
		return respond('upload', await uploadMap(file.name, Buffer.from(await file.arrayBuffer())));
	},
	rename: async ({ request }) => {
		const d = await request.formData();
		const from = String(d.get('from') ?? '');
		return respond(`row:${from}`, await renameMap(from, String(d.get('to') ?? '').trim()));
	},
	delete: async ({ request }) => {
		const name = String((await request.formData()).get('name') ?? '');
		return respond(`row:${name}`, await deleteMap(name));
	}
};
