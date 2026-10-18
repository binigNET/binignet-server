import { fail } from '@sveltejs/kit';
import { respond } from '$lib/server/actions';
import { MAX_SAVE_BYTES, deleteSave, hostSave, listSaves, uploadSave } from '$lib/server/aura/saves';
import { listAccounts } from '$lib/server/pvpgn/db';

export const load = async () => ({
	saves: await listSaves(),
	accounts: (await listAccounts().catch(() => [])).map((a) => a.username).sort((a, b) => a.localeCompare(b)),
	maxBytes: MAX_SAVE_BYTES
});

export const actions = {
	upload: async ({ request }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || !file.size) return fail(400, { form: 'upload', ok: false, message: 'choose a save file' });
		return respond('upload', await uploadSave(file.name, Buffer.from(await file.arrayBuffer())));
	},
	delete: async ({ request }) => {
		const name = String((await request.formData()).get('name') ?? '');
		return respond(`row:${name}`, await deleteSave(name));
	},
	host: async ({ request }) => {
		const d = await request.formData();
		const save = String(d.get('save') ?? '');
		const players = d.getAll('player').map((p) => String(p).trim());
		const r = await hostSave({ save, name: String(d.get('name') ?? ''), players });
		// success deletes the save (and its row), so report it at the top
		return respond(r.ok ? 'host' : `row:${save}`, r);
	}
};
