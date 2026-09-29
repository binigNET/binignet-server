import { redirect } from '@sveltejs/kit';
import { COOKIE } from '$lib/server/auth';

export const POST = ({ cookies }) => {
	cookies.delete(COOKIE, { path: '/' });
	redirect(303, '/login');
};
