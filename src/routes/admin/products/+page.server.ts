// src/routes/admin/products/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listAllProducts } from '#lib/server/shop';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (locals.user.role !== 'admin') throw error(403, 'Admin access required');

	return {
		user: locals.user,
		products: listAllProducts()
	};
};
