// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit/hooks';
// STATIC import — a dynamic `await import()` can resolve to a different module
// instance than the one the API route writes sessions into, so `locals.user`
// stays null while the session cookie is perfectly valid.
import { getUserFromSession } from '#lib/server/mock-auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('gymhouse_session');

	if (sessionToken) {
		const user = getUserFromSession(sessionToken);
		if (user) {
			event.locals.user = user;
		}
	}

	return resolve(event);
};
