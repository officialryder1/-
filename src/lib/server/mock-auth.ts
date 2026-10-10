// #lib/server/mock-auth.ts
// Mock authentication for the Gym House demo.
// In production this is replaced by Supabase Auth (@supabase/ssr).

export type UserRole = 'member' | 'receptionist' | 'admin';

export interface GymHouseUser {
	id: string;
	email: string;
	full_name: string;
	role: UserRole;
	gym_id: string;
	membership_status: 'active' | 'expired' | 'suspended';
	subscription_expires_at: string | null;
}

export interface Session {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	user: {
		id: string;
		email: string;
		user_metadata: { full_name: string };
	};
}

export const mockUsers: Record<string, GymHouseUser> = {
	'member-1': {
		id: 'member-1',
		email: 'alice@demogym.com',
		full_name: 'Alice Johnson',
		role: 'member',
		gym_id: 'gym-house-001',
		membership_status: 'active',
		subscription_expires_at: '2026-12-31T23:59:59Z'
	},
	'member-2': {
		id: 'member-2',
		email: 'bob@demogym.com',
		full_name: 'Bob Chen',
		role: 'member',
		gym_id: 'gym-house-001',
		membership_status: 'expired',
		subscription_expires_at: '2026-01-15T23:59:59Z'
	},
	'member-3': {
		id: 'member-3',
		email: 'chloe@demogym.com',
		full_name: 'Chloe Martin',
		role: 'member',
		gym_id: 'gym-house-001',
		membership_status: 'active',
		subscription_expires_at: '2026-11-30T23:59:59Z'
	},
	'reception-1': {
		id: 'reception-1',
		email: 'reception@demogym.com',
		full_name: 'Reception Staff',
		role: 'receptionist',
		gym_id: 'gym-house-001',
		membership_status: 'active',
		subscription_expires_at: null
	},
	'admin-1': {
		id: 'admin-1',
		email: 'admin@demogym.com',
		full_name: 'Sarah Manager',
		role: 'admin',
		gym_id: 'gym-house-001',
		membership_status: 'active',
		subscription_expires_at: null
	}
};

const mockCredentials: Record<string, { userId: string; password: string }> = {
	'alice@demogym.com': { userId: 'member-1', password: 'member123' },
	'bob@demogym.com': { userId: 'member-2', password: 'member123' },
	'chloe@demogym.com': { userId: 'member-3', password: 'member123' },
	'reception@demogym.com': { userId: 'reception-1', password: 'reception123' },
	'admin@demogym.com': { userId: 'admin-1', password: 'admin1234' }
};

export interface AuthError {
	code: string;
	message: string;
}

export interface AuthResult {
	success: boolean;
	user?: GymHouseUser;
	session?: Session;
	error?: AuthError;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sessions are kept on `globalThis` so they survive Vite HMR program reloads.
 * A module-scoped Map is re-created on every reload, which silently logs
 * everyone out mid-development.
 */
const SESSION_KEY = Symbol.for('gymhouse.sessions');
type SessionMap = Map<string, { userId: string; expiresAt: number }>;

function sessions(): SessionMap {
	const g = globalThis as unknown as Record<symbol, SessionMap | undefined>;
	if (!g[SESSION_KEY]) g[SESSION_KEY] = new Map();
	return g[SESSION_KEY]!;
}

function createSession(userId: string): string {
	const token = crypto.randomUUID();
	sessions().set(token, { userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
	return token;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
	await delay(300);

	const cred = mockCredentials[email];
	if (!cred || cred.password !== password) {
		return {
			success: false,
			error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
		};
	}

	const user = mockUsers[cred.userId];
	if (!user) {
		return { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
	}

	const sessionToken = createSession(user.id);
	const session: Session = {
		access_token: sessionToken,
		token_type: 'bearer',
		expires_in: 86400,
		refresh_token: crypto.randomUUID(),
		user: {
			id: user.id,
			email: user.email,
			user_metadata: { full_name: user.full_name }
		}
	};

	return { success: true, user, session };
}

export async function signOut(sessionToken: string): Promise<void> {
	await delay(100);
	sessions().delete(sessionToken);
}

export function getUserFromSession(sessionToken: string): GymHouseUser | null {
	const store = sessions();
	const session = store.get(sessionToken);
	if (!session) return null;

	if (session.expiresAt < Date.now()) {
		store.delete(sessionToken);
		return null;
	}

	return mockUsers[session.userId] ?? null;
}

export function requireRole(user: GymHouseUser | null, allowedRoles: UserRole[]): boolean {
	if (!user) return false;
	return allowedRoles.includes(user.role);
}
