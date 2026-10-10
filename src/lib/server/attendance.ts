// #lib/server/attendance.ts
// Attendance sessions for the Gym House demo.
// Business rules: one open session per member per gym; check-out requires an
// open session. In production these are `attendance_sessions` rows with a
// partial unique index enforcing the single-open-session rule.

import { mockUsers } from './mock-auth';

export interface AttendanceSession {
	id: string;
	gym_id: string;
	member_id: string;
	member_name: string;
	check_in_at: string;
	check_out_at: string | null;
}

export type AttendanceError =
	| 'MEMBER_NOT_FOUND'
	| 'NOT_ELIGIBLE'
	| 'ALREADY_OPEN'
	| 'NO_OPEN_SESSION';

export interface AttendanceResult {
	ok: boolean;
	session?: AttendanceSession;
	error?: AttendanceError;
	message?: string;
}

const SESSION_KEY = Symbol.for('gymhouse.attendance');

function sessions(): AttendanceSession[] {
	const g = globalThis as unknown as Record<symbol, AttendanceSession[] | undefined>;
	if (!g[SESSION_KEY]) g[SESSION_KEY] = seed();
	return g[SESSION_KEY]!;
}

export function openSessionFor(memberId: string): AttendanceSession | null {
	return sessions().find((s) => s.member_id === memberId && s.check_out_at === null) ?? null;
}

export function currentOccupancy(): number {
	return sessions().filter((s) => s.check_out_at === null).length;
}

export function recentSessions(limit = 10): AttendanceSession[] {
	return [...sessions()]
		.sort((a, b) => (a.check_in_at < b.check_in_at ? 1 : -1))
		.slice(0, limit);
}

/** Check a member in. Rejects ineligible members and duplicate open sessions. */
export function checkIn(memberId: string): AttendanceResult {
	const user = mockUsers[memberId];
	if (!user) {
		return { ok: false, error: 'MEMBER_NOT_FOUND', message: 'Member not found.' };
	}
	if (user.membership_status !== 'active') {
		return {
			ok: false,
			error: 'NOT_ELIGIBLE',
			message: `${user.full_name} is ${user.membership_status}. Access is not allowed.`
		};
	}
	if (openSessionFor(memberId)) {
		return {
			ok: false,
			error: 'ALREADY_OPEN',
			message: `${user.full_name} already has an open session.`
		};
	}

	const session: AttendanceSession = {
		id: crypto.randomUUID(),
		gym_id: user.gym_id,
		member_id: memberId,
		member_name: user.full_name,
		check_in_at: new Date().toISOString(),
		check_out_at: null
	};
	sessions().unshift(session);
	return { ok: true, session };
}

/** Check a member out. Requires an open session. */
export function checkOut(memberId: string): AttendanceResult {
	const user = mockUsers[memberId];
	if (!user) {
		return { ok: false, error: 'MEMBER_NOT_FOUND', message: 'Member not found.' };
	}
	const open = openSessionFor(memberId);
	if (!open) {
		return {
			ok: false,
			error: 'NO_OPEN_SESSION',
			message: `${user.full_name} has no open session to close.`
		};
	}
	open.check_out_at = new Date().toISOString();
	return { ok: true, session: open };
}

// --- demo seed: a couple of members currently on the floor ---
function seed(): AttendanceSession[] {
	const now = Date.now();
	return [
		{
			id: crypto.randomUUID(),
			gym_id: 'gym-house-001',
			member_id: 'member-1',
			member_name: 'Alice Johnson',
			check_in_at: new Date(now - 42 * 60_000).toISOString(),
			check_out_at: null
		},
		{
			id: crypto.randomUUID(),
			gym_id: 'gym-house-001',
			member_id: 'member-3',
			member_name: 'Chloe Martin',
			check_in_at: new Date(now - 18 * 60_000).toISOString(),
			check_out_at: null
		}
	];
}
