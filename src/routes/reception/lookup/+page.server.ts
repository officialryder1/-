// src/routes/reception/lookup/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { mockUsers } from '#lib/server/mock-auth';
import { getActiveSubscription, getPlan } from '#lib/server/plans';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'receptionist' && locals.user.role !== 'admin') {
		throw error(403, 'Reception access required');
	}

	const members = Object.values(mockUsers)
		.filter((u) => u.role === 'member')
		.map((u) => {
			const sub = getActiveSubscription(u.id);
			return {
				id: u.id,
				name: u.full_name,
				status: u.membership_status,
				plan: sub ? (getPlan(sub.plan_id)?.name ?? '—') : '—'
			};
		});

	return {
		user: locals.user,
		members
	};
};
