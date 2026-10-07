// src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import type { GymHouseUser } from '#lib/server/mock-auth';

export interface AuthState {
	user: GymHouseUser | null;
	loading: boolean;
}

const { subscribe, set, update } = writable<AuthState>({
	user: null,
	loading: true
});

export const auth = {
	subscribe,
	set,
	update,
	// Set logged-in user
	login: (user: GymHouseUser) => set({ user, loading: false }),
	// Clear user
	logout: () => set({ user: null, loading: false }),
	// Set loading state
	setLoading: (loading: boolean) => update((s) => ({ ...s, loading }))
};