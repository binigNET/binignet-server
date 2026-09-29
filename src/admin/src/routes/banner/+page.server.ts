import { MAX_BANNER_BYTES, getBanner, setBanner } from '$lib/server/pvpgn/banner';
import { respond } from '$lib/server/actions';

export const load = async () => ({ banner: await getBanner().catch(() => null), maxBytes: MAX_BANNER_BYTES });

export const actions = {
	default: async ({ request }) => {
		const d = await request.formData();
		const file = d.get('file');
		const png = file instanceof File && file.size ? Buffer.from(await file.arrayBuffer()) : null;
		return respond('banner', await setBanner(png, String(d.get('url') ?? '').trim()));
	}
};
