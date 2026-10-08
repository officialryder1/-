// src/routes/admin/attendance/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getAdminInsights } from '#lib/server/analytics';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	const insights = getAdminInsights();

	return {
		user: locals.user,
		insights
	};
};
