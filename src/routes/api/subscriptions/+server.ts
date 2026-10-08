// src/routes/api/subscriptions/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSubscription, getActiveSubscription, getSubscriptionHistory, getAllSubscriptions } from '#lib/server/plans';
import { getUserFromSession } from '#lib/server/mock-auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (user.role === 'admin') {
		return json({ subscriptions: getAllSubscriptions() });
	}

	return json({ subscriptions: getSubscriptionHistory(user.id) });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { planId, paymentMethod } = body;

	if (!planId) {
		return json({ error: 'planId is required' }, { status: 400 });
	}

	if (!paymentMethod || !['paystack', 'manual', 'pay_at_gym'].includes(paymentMethod)) {
		return json({ error: 'paymentMethod must be paystack, manual, or pay_at_gym' }, { status: 400 });
	}

	const result = createSubscription(user.id, planId, paymentMethod);

	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ subscription: result.subscription }, { status: 201 });
};
