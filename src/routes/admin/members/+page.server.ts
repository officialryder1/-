// src/routes/admin/members/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { mockUsers } from '#lib/server/mock-auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	const members = Object.values(mockUsers)
		.filter((u) => u.role === 'member')
		.map((u) => ({
			id: u.id,
			name: u.full_name,
			email: u.email,
			status: u.membership_status,
			expires: u.subscription_expires_at
		}));

	return {
		user: locals.user,
		members
	};
};
