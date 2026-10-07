import type { Actions, PageServerLoad } from './$types';
import { signIn } from '#lib/server/mock-auth';
import { getRoleRedirectPath } from '#lib/server/redirects';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Already signed in? Send them to their desk.
	if (locals.user) {
		throw redirect(302, getRoleRedirectPath(locals.user.role));
	}
	return {};
};

export const actions: Actions = {
	// NOTE: the action is named `default` but the form must NOT post to `?/default`.
	// SvelteKit 3 reserves that explicit name and 500s with `action_name_reserved`.
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		const result = await signIn(email, password);

		if (result.success && result.session && result.user) {
			cookies.set('gymhouse_session', result.session.access_token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24
			});
			throw redirect(303, getRoleRedirectPath(result.user.role));
		}

		return fail(401, {
			error: result.error?.message ?? 'Invalid email or password.'
		});
	}
};
