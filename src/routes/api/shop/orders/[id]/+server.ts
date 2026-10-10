// src/routes/api/shop/orders/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrder, updateOrderStatus } from '#lib/server/shop';
import { getUserFromSession } from '#lib/server/mock-auth';
import { record } from '#lib/server/audit';
import type { OrderStatus } from '#lib/server/shop';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];

export const GET: RequestHandler = async ({ params, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const order = getOrder(params.id);
	if (!order) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	// Members can only see their own orders
	if (user.role === 'member' && order.member_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	return json({ order });
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
	const { status } = body;

	if (!status || !VALID_STATUSES.includes(status)) {
		return json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
	}

	const order = updateOrderStatus(params.id, status);
	if (!order) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	record({
		actor: user,
		action: 'order.status_changed',
		entity: `order:${order.id}`,
		summary: `Order ${order.id} set to ${status}`,
		meta: { status, member_id: order.member_id }
	});

	return json({ order });
};
