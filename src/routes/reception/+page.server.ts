// src/routes/reception/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { currentOccupancy, recentSessions } from '#lib/server/attendance';
import { mockUsers } from '#lib/server/mock-auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (locals.user.role !== 'receptionist' && locals.user.role !== 'admin') {
		throw error(403, 'Reception access required');
	}

	// Derived from the single source of truth so reception can never offer a
	// member the door API does not know about.
	const members = Object.values(mockUsers)
		.filter((u) => u.role === 'member')
		.map((u) => ({ id: u.id, name: u.full_name, status: u.membership_status }));

	return {
		user: locals.user,
		recentVisits: recentSessions(8).map((s) => ({
			time: new Date(s.check_in_at).toLocaleTimeString('en-GB', {
				hour: '2-digit',
				minute: '2-digit'
			}),
			name: s.member_name,
			status: s.check_out_at ? 'checked-out' : 'checked-in'
		})),
		currentOccupancy: currentOccupancy(),
		capacity: 30,
		members
	};
};
