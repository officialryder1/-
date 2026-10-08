// src/routes/admin/staff/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { mockUsers } from '#lib/server/mock-auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	const staff = Object.values(mockUsers)
		.filter((u) => u.role === 'admin' || u.role === 'receptionist')
		.map((u) => ({
			id: u.id,
			name: u.full_name,
			email: u.email,
			role: u.role
		}));

	return {
		user: locals.user,
		staff
	};
};
