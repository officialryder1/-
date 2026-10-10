// src/routes/api/attendance/+server.ts
// Door events: check-in / check-out. Records an audit entry for every action
// (business rule 6: staff actions are recorded).
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkIn, checkOut, currentOccupancy, recentSessions } from '#lib/server/attendance';
import { getUserFromSession } from '#lib/server/mock-auth';
import { record } from '#lib/server/audit';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (user.role !== 'receptionist' && user.role !== 'admin') {
		return json({ error: 'Reception access required' }, { status: 403 });
	}

	return json({
		occupancy: currentOccupancy(),
		recent: recentSessions()
	});
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (user.role !== 'receptionist' && user.role !== 'admin') {
		return json({ error: 'Reception access required' }, { status: 403 });
	}

	const body = await request.json();
	const { memberId, direction } = body;

	if (!memberId || typeof memberId !== 'string') {
		return json({ error: 'memberId is required' }, { status: 400 });
	}
	if (direction !== 'in' && direction !== 'out') {
		return json({ error: "direction must be 'in' or 'out'" }, { status: 400 });
	}

	const result = direction === 'in' ? checkIn(memberId) : checkOut(memberId);

	if (!result.ok) {
		return json({ error: result.message, code: result.error }, { status: 400 });
	}

	const session = result.session!;
	record({
		actor: user,
		action: direction === 'in' ? 'member.checked_in' : 'member.checked_out',
		entity: `member:${memberId}`,
		summary: `${session.member_name} checked ${direction === 'in' ? 'in' : 'out'}`,
		meta: { session_id: session.id }
	});

	return json({ session, occupancy: currentOccupancy() }, { status: 201 });
};
