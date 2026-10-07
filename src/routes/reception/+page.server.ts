// src/routes/reception/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (locals.user.role !== 'receptionist' && locals.user.role !== 'admin') {
		throw error(403, 'Reception access required');
	}

	const members = [
		{ id: 'member-1', name: 'Alice Johnson', status: 'active' },
		{ id: 'member-2', name: 'Bob Chen', status: 'expired' },
		{ id: 'member-3', name: 'Chloe Martin', status: 'active' }
	] as const;

	return {
		user: locals.user,
		recentVisits: [
			{ time: '09:15', name: 'Alice Johnson', status: 'checked-in' },
			{ time: '08:55', name: 'Mike Wilson', status: 'checked-out' },
			{ time: '08:45', name: 'Sarah Davis', status: 'checked-in' },
			{ time: '08:30', name: 'Tom Brown', status: 'checked-out' }
		],
		currentOccupancy: 4,
		capacity: 30,
		members
	};
};
