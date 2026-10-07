// Gym House — SvelteKit 3 config.
//
// NOTE ON THE `.js` EXTENSION AND `--configLoader`:
// SvelteKit 3 removed `svelte.config.js`; all config lives in this Vite plugin.
// Vite 8's default `configLoader: 'bundle'` loads the config in a separate ESM
// context, which makes SvelteKit's `isRunnableDevEnvironment` instanceof check
// fail across two Vite instances (error: vite_ssr_environment_not_runnable).
// The `runner` loader fixes that but is flaky when the config must also be
// transpiled. Keeping this file as plain JS (no TypeScript) removes the
// transform step and makes the dev server start reliably.

import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			compilerOptions: {
				// Force runes mode for the app, but never for node_modules:
				// lucide-svelte still uses legacy `$$props` and hard-fails under runes.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.js',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
