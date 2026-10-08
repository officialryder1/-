// src/routes/api/subscriptions/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cancelSubscription, updateSubscriptionStatus } from '#lib/server/plans';
import { getUserFromSession } from '#lib/server/mock-auth';
import type { SubscriptionStatus } from '#lib/server/plans';

const VALID_STATUSES: SubscriptionStatus[] = ['pending', 'active', 'expired', 'cancelled', 'suspended'];

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { status, action } = body;

	// Members can only cancel their own subscription
	if (action === 'cancel') {
		if (user.role !== 'member' && user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		const sub = cancelSubscription(params.id);
		if (!sub) {
			return json({ error: 'Subscription not found' }, { status: 404 });
		}
		return json({ subscription: sub });
	}

	// Admins can update status
	if (user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	if (!status || !VALID_STATUSES.includes(status)) {
		return json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
	}

	const sub = updateSubscriptionStatus(params.id, status);
	if (!sub) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	return json({ subscription: sub });
};
