// src/routes/reception/lookup/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'receptionist' && locals.user.role !== 'admin') {
		throw error(403, 'Reception access required');
	}

	return {
		user: locals.user,
		members: [
			{ id: 'member-1', name: 'Alice Johnson', status: 'active', plan: 'Unlimited' },
			{ id: 'member-2', name: 'Bob Chen', status: 'expired', plan: 'Basic' },
			{ id: 'member-3', name: 'Chloe Martin', status: 'active', plan: 'Premium' }
		]
	};
};
