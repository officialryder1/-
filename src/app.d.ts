// Extend SvelteKit's App interface for our auth types

declare namespace App {
	interface Locals {
		user: import('#lib/server/mock-auth').GymHouseUser | null;
		session: {
			access_token: string;
			token_type: string;
			expires_in: number;
			refresh_token: string;
			user: {
				id: string;
				email: string;
				user_metadata: { full_name: string };
			};
		} | null;
	}
}