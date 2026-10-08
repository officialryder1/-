// src/routes/admin/subscriptions/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getAllSubscriptions, listAllPlans } from '#lib/server/plans';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	return {
		user: locals.user,
		subscriptions: getAllSubscriptions(),
		plans: listAllPlans()
	};
};
