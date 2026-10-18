import { fields, respond } from '$lib/server/actions';
import { alert, announce, readTextFile, saveTextFile, whisper } from '$lib/server/pvpgn/commands';

export const load = async () => ({
	motd: await readTextFile('motd').catch(() => ''),
	news: await readTextFile('news').catch(() => '')
});

export const actions = {
	announce: async ({ request }) => respond('announce', await announce((await fields(request)).str('message'))),
	alert: async ({ request }) => respond('alert', await alert((await fields(request)).raw('message'))),
	whisper: async ({ request }) => {
		const f = await fields(request);
		return respond('whisper', await whisper(f.str('user'), f.str('message')));
	},
	motd: async ({ request }) => respond('motd', await saveTextFile('motd', (await fields(request)).raw('text'))),
	news: async ({ request }) => respond('news', await saveTextFile('news', (await fields(request)).raw('text')))
};
