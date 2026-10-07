// #lib/roles.ts
// Shared, isomorphic role helpers.
//
// This module must stay free of `$app/server`, cookies, and any Node built-ins
// so both the client bundle and the server can import it. Server-only access
// rules live in `#lib/server/redirects.ts`.

export type UserRole = 'member' | 'receptionist' | 'admin';

/** Where a user of this role belongs after sign-in. */
export function getRoleRedirectPath(role: UserRole): string {
	switch (role) {
		case 'admin':
			return '/admin';
		case 'receptionist':
			return '/reception';
		case 'member':
			return '/member';
		default:
			return '/auth/signin';
	}
}

export function getDashboardTitle(role: UserRole): string {
	switch (role) {
		case 'admin':
			return 'Operations';
		case 'receptionist':
			return 'Front desk';
		case 'member':
			return 'My gym';
		default:
			return 'Gym House';
	}
}
