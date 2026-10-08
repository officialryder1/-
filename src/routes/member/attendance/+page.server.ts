// src/routes/member/attendance/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getMemberInsights } from '#lib/server/analytics';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'member' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	return {
		user: locals.user,
		insights: getMemberInsights(locals.user.id)
	};
};
