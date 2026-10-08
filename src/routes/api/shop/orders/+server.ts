// src/routes/api/shop/orders/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrder, listOrdersForMember, listAllOrders } from '#lib/server/shop';
import { getUserFromSession } from '#lib/server/mock-auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (user.role === 'admin') {
		return json({ orders: listAllOrders() });
	}

	return json({ orders: listOrdersForMember(user.id) });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { items } = body;

	if (!Array.isArray(items) || items.length === 0) {
		return json({ error: 'Items must be a non-empty array' }, { status: 400 });
	}

	for (const item of items) {
		if (!item.productId || !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
			return json({ error: 'Each item needs productId and a positive quantity' }, { status: 400 });
		}
	}

	const result = createOrder(user.id, user.gym_id, items);

	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ order: result.order }, { status: 201 });
};
