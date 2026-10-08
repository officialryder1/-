// src/routes/admin/reports/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getAdminInsights } from '#lib/server/analytics';
import { getAllSubscriptions, listAllPlans } from '#lib/server/plans';
import { listAllOrders } from '#lib/server/shop';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	const insights = getAdminInsights();
	const subscriptions = getAllSubscriptions();
	const plans = listAllPlans();
	const orders = listAllOrders();

	return {
		user: locals.user,
		insights,
		subscriptions,
		plans,
		orders
	};
};
