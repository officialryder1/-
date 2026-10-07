import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	// Admins may inspect any area; members only their own.
	if (locals.user.role !== 'member' && locals.user.role !== 'admin') {
		throw error(403, 'Forbidden');
	}

	// Mock data for the demo. Replace with Supabase queries once the DB is wired.
	// The pass token stands in for a hashed, revocable QR token (see the brief,
	// section 8: member_qr_tokens stores token_hash, never a raw secret).
	const passToken = `demo-${locals.user.id}-pass`;

	const attendanceHistory = [
		{ date: '2026-09-30', check_in: '08:45', check_out: '09:55', duration: '1h 10m' },
		{ date: '2026-09-28', check_in: '09:15', check_out: '10:30', duration: '1h 15m' },
		{ date: '2026-09-25', check_in: '08:30', check_out: '09:45', duration: '1h 15m' },
		{ date: '2026-09-23', check_in: '10:00', check_out: '11:00', duration: '1h 00m' },
		{ date: '2026-09-20', check_in: '08:50', check_out: '09:50', duration: '1h 00m' }
	];

	const recentOrders = [
		{ id: 'GH-1041', date: '2026-09-25', total: 'NGN 18,500', status: 'completed' },
		{ id: 'GH-1038', date: '2026-09-18', total: 'NGN 4,200', status: 'pending' }
	];

	return {
		user: locals.user,
		passToken,
		planName: 'Unlimited',
		attendanceHistory,
		recentOrders
	};
};
