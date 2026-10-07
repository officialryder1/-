// src/routes/admin/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	// Mock data for demo — replace with Supabase queries once the DB is wired.
	return {
		user: locals.user,
		stats: {
			totalMembers: 12,
			activeMembers: 9,
			expiredMembers: 2,
			suspendedMembers: 1,
			todayCheckIns: 7,
			currentOccupancy: 4,
			monthlyRevenue: 3250
		},
		recentCheckIns: [
			{ time: '09:15', member: 'Alice Johnson', status: 'check-in' },
			{ time: '08:45', member: 'Mike Wilson', status: 'check-in' },
			{ time: '08:30', member: 'Sarah Davis', status: 'check-out' },
			{ time: '08:15', member: 'Tom Brown', status: 'check-in' }
		],
		upcomingExpirations: [
			{ name: 'John Smith', date: '2026-10-05', plan: 'Basic' },
			{ name: 'Jane Doe', date: '2026-10-12', plan: 'Premium' }
		]
	};
};
