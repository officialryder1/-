// #lib/server/redirects.ts
// Server-only access control. Imported exclusively from `+page.server.ts` /
// `hooks.server.ts`; never from a component (SvelteKit blocks that with
// `server_only_import`, and it would ship the rule set to the browser).

import type { GymHouseUser } from './mock-auth';
import type { UserRole } from '#lib/roles.js';

export { getRoleRedirectPath, getDashboardTitle } from '#lib/roles.js';

/**
 * Access rules:
 *   /admin      -> admin only
 *   /reception  -> receptionist + admin
 *   /member     -> member + admin
 *   /auth/*     -> public
 * Admin is deliberately a superset so a manager can inspect any screen.
 */
export function canAccessRoute(user: GymHouseUser | null, pathname: string): boolean {
	if (pathname.startsWith('/auth')) return true;

	if (!user) return false;

	if (pathname.startsWith('/admin')) return user.role === 'admin';
	if (pathname.startsWith('/reception')) return user.role === 'receptionist' || user.role === 'admin';
	if (pathname.startsWith('/member')) return user.role === 'member' || user.role === 'admin';

	return true;
}

export function assertRole(user: GymHouseUser | null, allowed: UserRole[]): boolean {
	if (!user) return false;
	return allowed.includes(user.role);
}
