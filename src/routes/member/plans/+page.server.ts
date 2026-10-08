// src/routes/member/plans/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listPlans, getActiveSubscription, getSubscriptionHistory } from '#lib/server/plans';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'member' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	return {
		user: locals.user,
		plans: listPlans(),
		activeSubscription: getActiveSubscription(locals.user.id),
		subscriptionHistory: getSubscriptionHistory(locals.user.id)
	};
};
