// src/routes/api/plans/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlan, updatePlan, deletePlan } from '#lib/server/plans';
import { getUserFromSession } from '#lib/server/mock-auth';

export const GET: RequestHandler = async ({ params }) => {
	const plan = getPlan(params.id);
	if (!plan) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}
	return json({ plan });
};

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const body = await request.json();
	const { name, description, price, duration_days, features, is_active } = body;

	if (price != null && (typeof price !== 'number' || price < 0)) {
		return json({ error: 'Price must be a non-negative number' }, { status: 400 });
	}

	if (duration_days != null && (typeof duration_days !== 'number' || duration_days < 1 || !Number.isInteger(duration_days))) {
		return json({ error: 'Duration must be a positive integer (days)' }, { status: 400 });
	}

	const plan = updatePlan(params.id, {
		...(name !== undefined && { name }),
		...(description !== undefined && { description }),
		...(price !== undefined && { price }),
		...(duration_days !== undefined && { duration_days }),
		...(features !== undefined && { features }),
		...(is_active !== undefined && { is_active })
	});

	if (!plan) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	return json({ plan });
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const deleted = deletePlan(params.id);
	if (!deleted) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	return json({ success: true });
};
