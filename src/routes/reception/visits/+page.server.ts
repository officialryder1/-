// src/routes/reception/visits/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'receptionist' && locals.user.role !== 'admin') {
		throw error(403, 'Reception access required');
	}

	return {
		user: locals.user,
		recentVisits: [
			{ time: '09:15', name: 'Alice Johnson', status: 'checked-in' },
			{ time: '08:55', name: 'Mike Wilson', status: 'checked-out' },
			{ time: '08:45', name: 'Sarah Davis', status: 'checked-in' },
			{ time: '08:30', name: 'Tom Brown', status: 'checked-out' },
			{ time: '08:15', name: 'Jane Smith', status: 'checked-in' },
			{ time: '07:45', name: 'John Doe', status: 'checked-out' },
			{ time: '07:30', name: 'Emily White', status: 'checked-in' },
			{ time: '07:00', name: 'Chris Lee', status: 'checked-out' }
		]
	};
};
