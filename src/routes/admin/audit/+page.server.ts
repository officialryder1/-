// src/routes/admin/audit/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listAudit, auditStats } from '#lib/server/audit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	return {
		user: locals.user,
		entries: listAudit(100),
		stats: auditStats()
	};
};
