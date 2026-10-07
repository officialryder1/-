// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getRoleRedirectPath } from '#lib/server/redirects';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, getRoleRedirectPath(locals.user.role));
	}
	return {};
};