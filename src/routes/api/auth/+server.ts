// src/routes/api/auth/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { signIn, signOut, getUserFromSession } from '#lib/server/mock-auth';
import type { UserRole } from '#lib/server/mock-auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { action, email, password } = body;

	if (action === 'signin') {
		const result = await signIn(email, password);
		if (result.success && result.session) {
			// Set session cookie (HttpOnly for security)
			cookies.set('gymhouse_session', result.session.access_token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 // 24 hours
			});
			return json({ success: true, user: result.user });
		}
		return json({ success: false, error: result.error }, { status: 401 });
	}

	if (action === 'signout') {
		const sessionToken = cookies.get('gymhouse_session');
		if (sessionToken) {
			await signOut(sessionToken);
		}
		cookies.delete('gymhouse_session', { path: '/' });
		return json({ success: true });
	}

	return json({ success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } }, { status: 400 });
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = getUserFromSession(sessionToken || '');

	if (!user) {
		return json({ authenticated: false, user: null });
	}

	return json({
		authenticated: true,
		user: {
			id: user.id,
			email: user.email,
			full_name: user.full_name,
			role: user.role,
			membership_status: user.membership_status,
			subscription_expires_at: user.subscription_expires_at
		}
	});
};

export const prerender = false;