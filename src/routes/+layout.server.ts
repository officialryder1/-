// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { getUserFromSession } from '#lib/server/mock-auth';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (user) {
		return {
			user: {
				id: user.id,
				email: user.email,
				full_name: user.full_name,
				role: user.role,
				gym_id: user.gym_id,
				membership_status: user.membership_status,
				subscription_expires_at: user.subscription_expires_at
			}
		};
	}

	return { user: null };
};