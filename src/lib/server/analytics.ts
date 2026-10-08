// src/lib/server/analytics.ts
// Analytics engine for Gym House demo.
// Computes insights from attendance, subscription, and shop data.
// In production this is replaced by Supabase aggregation queries.

import { getAllSubscriptions, listAllPlans } from './plans';
import { listAllOrders } from './shop';
import { mockUsers } from './mock-auth';

export interface AttendanceRecord {
	date: string; // ISO date
	check_in: string; // HH:MM
	check_out: string; // HH:MM
	duration: string; // "1h 10m"
}

export interface MemberInsights {
	visitsThisWeek: number;
	visitsThisMonth: number;
	mostActiveDay: string;
	currentStreak: number;
	longestStreak: number;
	avgDuration: string;
	totalVisits: number;
	recentHistory: AttendanceRecord[];
}

export interface AdminInsights {
	todayCheckIns: number;
	currentOccupancy: number;
	visitsToday: number;
	visitsThisWeek: number;
	visitsThisMonth: number;
	peakHour: string;
	peakDay: string;
	activeMembers: number;
	expiringSoon: number;
	expiredMembers: number;
	suspendedMembers: number;
	inactiveMembers: number;
	monthlyRevenue: number;
	totalRevenue: number;
	recentCheckIns: { time: string; member: string; status: string }[];
	visitsByDay: { day: string; count: number }[];
	visitsByHour: { hour: string; count: number }[];
}

// --- seed attendance data (30 days of realistic gym visits) ---

function generateAttendanceData(): AttendanceRecord[] {
	const records: AttendanceRecord[] = [];
	const now = new Date();
	const checkInTimes = ['06:30', '07:15', '08:00', '08:45', '09:30', '17:00', '18:30', '19:15'];
	const durations = ['45m', '1h 00m', '1h 15m', '1h 30m', '1h 45m', '2h 00m'];

	for (let i = 0; i < 30; i++) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);

		// Skip some days to create realistic gaps (rest days)
		if (Math.random() < 0.3) continue;

		const dayOfWeek = date.getDay();
		// Less likely to visit on weekends
		if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.6) continue;

		const checkIn = checkInTimes[Math.floor(Math.random() * checkInTimes.length)];
		const duration = durations[Math.floor(Math.random() * durations.length)];

		// Calculate check-out from check-in + duration
		const [inH, inM] = checkIn.split(':').map(Number);
		const durMatch = duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
		const durH = durMatch?.[1] ? parseInt(durMatch[1]) : 0;
		const durM = durMatch?.[2] ? parseInt(durMatch[2]) : 0;
		const totalMin = inH * 60 + inM + durH * 60 + durM;
	 const outH = Math.floor(totalMin / 60) % 24;
		const outM = totalMin % 60;
		const checkOut = `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;

		records.push({
			date: date.toISOString().split('T')[0],
			check_in: checkIn,
			check_out: checkOut,
			duration
		});
	}

	return records.sort((a, b) => b.date.localeCompare(a.date));
}

// --- globalThis store ---

const ANALYTICS_KEY = Symbol.for('gymhouse.analytics');

interface AnalyticsStore {
	attendanceData: AttendanceRecord[];
}

function analyticsStore(): AnalyticsStore {
	const g = globalThis as unknown as Record<symbol, AnalyticsStore | undefined>;
	if (!g[ANALYTICS_KEY]) {
		g[ANALYTICS_KEY] = {
			attendanceData: generateAttendanceData()
		};
	}
	return g[ANALYTICS_KEY]!;
}

// --- member insights ---

export function getMemberInsights(memberId: string): MemberInsights {
	const data = analyticsStore().attendanceData;
	const now = new Date();
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const visitsThisWeek = data.filter((r) => new Date(r.date) >= oneWeekAgo).length;
	const visitsThisMonth = data.filter((r) => new Date(r.date) >= oneMonthAgo).length;

	// Most active day of week
	const dayCounts: Record<string, number> = {};
	for (const r of data) {
		const day = new Date(r.date).toLocaleDateString('en-GB', { weekday: 'long' });
		dayCounts[day] = (dayCounts[day] || 0) + 1;
	}
	const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

	// Streaks
	let currentStreak = 0;
	let longestStreak = 0;
	let streak = 0;
	const sortedDates = data.map((r) => r.date).sort();
	for (let i = 0; i < sortedDates.length; i++) {
		if (i === 0) {
			streak = 1;
		} else {
			const prev = new Date(sortedDates[i - 1]);
			const curr = new Date(sortedDates[i]);
			const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
			if (diffDays <= 1.5) {
				streak++;
			} else {
				streak = 1;
			}
		}
		longestStreak = Math.max(longestStreak, streak);
	}

	// Current streak (from today backwards)
	const today = now.toISOString().split('T')[0];
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
	if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
		currentStreak = 1;
		for (let i = sortedDates.length - 1; i >= 0; i--) {
			const curr = new Date(sortedDates[i]);
			const prev = new Date(sortedDates[i - 1]);
			if (!prev) break;
			const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
			if (diffDays <= 1.5) currentStreak++;
			else break;
		}
	}

	// Average duration
	const totalMinutes = data.reduce((sum, r) => {
		const m = r.duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
		const h = m?.[1] ? parseInt(m[1]) : 0;
		const min = m?.[2] ? parseInt(m[2]) : 0;
		return sum + h * 60 + min;
	}, 0);
	const avgMin = data.length > 0 ? Math.round(totalMinutes / data.length) : 0;
	const avgDuration = `${Math.floor(avgMin / 60)}h ${avgMin % 60}m`;

	return {
		visitsThisWeek,
		visitsThisMonth,
		mostActiveDay,
		currentStreak,
		longestStreak,
		avgDuration,
		totalVisits: data.length,
		recentHistory: data.slice(0, 10)
	};
}

// --- admin insights ---

export function getAdminInsights(): AdminInsights {
	const data = analyticsStore().attendanceData;
	const subscriptions = getAllSubscriptions();
	const plans = listAllPlans();
	const orders = listAllOrders();
	const now = new Date();
	const today = now.toISOString().split('T')[0];
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const visitsToday = data.filter((r) => r.date === today).length;
	const visitsThisWeek = data.filter((r) => new Date(r.date) >= oneWeekAgo).length;
	const visitsThisMonth = data.filter((r) => new Date(r.date) >= oneMonthAgo).length;

	// Peak hour
	const hourCounts: Record<string, number> = {};
	for (const r of data) {
		const hour = r.check_in.split(':')[0] + ':00';
		hourCounts[hour] = (hourCounts[hour] || 0) + 1;
	}
	const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

	// Peak day
	const dayCounts: Record<string, number> = {};
	for (const r of data) {
		const day = new Date(r.date).toLocaleDateString('en-GB', { weekday: 'long' });
		dayCounts[day] = (dayCounts[day] || 0) + 1;
	}
	const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

	// Membership status
	const activeMembers = subscriptions.filter((s) => s.status === 'active').length;
	const expiringSoon = subscriptions.filter((s) => {
		if (s.status !== 'active') return false;
		const expires = new Date(s.expires_at);
		const diffDays = (expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
		return diffDays > 0 && diffDays <= 7;
	}).length;
	const expiredMembers = subscriptions.filter((s) => s.status === 'expired').length;
	const suspendedMembers = subscriptions.filter((s) => s.status === 'suspended').length;

	// Inactive members (no visit in 14 days)
	const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
	const memberIds = Object.keys(mockUsers).filter((id) => mockUsers[id].role === 'member');
	const inactiveMembers = memberIds.filter((id) => {
		const lastVisit = data.find((r) => r.date !== undefined);
		return !lastVisit || new Date(lastVisit.date) < twoWeeksAgo;
	}).length;

	// Revenue
	const monthlyRevenue = orders
		.filter((o) => new Date(o.created_at) >= oneMonthAgo)
		.reduce((sum, o) => sum + o.subtotal, 0);
	const totalRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);

	// Visits by day (last 7 days)
	const visitsByDay: { day: string; count: number }[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const dateStr = d.toISOString().split('T')[0];
		const count = data.filter((r) => r.date === dateStr).length;
		visitsByDay.push({
			day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
			count
		});
	}

	// Visits by hour
	const visitsByHour: { hour: string; count: number }[] = [];
	for (let h = 6; h <= 21; h++) {
		const hourStr = `${String(h).padStart(2, '0')}:00`;
		const count = data.filter((r) => r.check_in.startsWith(String(h).padStart(2, '0'))).length;
		visitsByHour.push({ hour: hourStr, count });
	}

	return {
		todayCheckIns: visitsToday,
		currentOccupancy: Math.max(0, visitsToday - 2), // rough estimate
		visitsToday,
		visitsThisWeek,
		visitsThisMonth,
		peakHour,
		peakDay,
		activeMembers,
		expiringSoon,
		expiredMembers,
		suspendedMembers,
		inactiveMembers,
		monthlyRevenue,
		totalRevenue,
		recentCheckIns: data.slice(0, 8).map((r) => ({
			time: r.check_in,
			member: 'Member',
			status: 'check-in'
		})),
		visitsByDay,
		visitsByHour
	};
}
