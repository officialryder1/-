// Gym House Service Worker
// Offline-capable: precaches the app shell + build assets, serves a
// dedicated offline page when the network is unavailable.

const VERSION = 'v2';
const SHELL_CACHE = `gymhouse-shell-${VERSION}`;
const ASSET_CACHE = `gymhouse-assets-${VERSION}`;
const PAGE_CACHE = `gymhouse-pages-${VERSION}`;
const OFFLINE_URL = '/offline';

const PRECACHE = [
	'/',
	'/offline',
	'/auth/signin',
	'/manifest.webmanifest',
	'/favicon.svg',
	'/icons/icon.svg',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

// Install: precache individually so one 404 cannot abort the whole install.
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(SHELL_CACHE).then((cache) =>
			Promise.all(
				PRECACHE.map((url) =>
					cache.add(url).catch((err) => {
						console.warn('[sw] precache skipped:', url, err.message);
					})
				)
			)
		)
	);
	self.skipWaiting();
});

// Activate: drop stale caches, take control immediately.
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => !key.endsWith(`-${VERSION}`))
						.map((key) => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	);
});

function isBuildAsset(url) {
	return url.pathname.startsWith('/_app/immutable/');
}

self.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Never intercept cross-origin or API traffic — always live.
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith('/api/')) return;

	// Navigations: network-first, fall back to cached page then offline page.
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				.catch(async () => {
					const cached = await caches.match(request);
					if (cached) return cached;
					const shell = await caches.match('/');
					if (shell) return shell;
					return (await caches.match(OFFLINE_URL)) || Response.error();
				})
		);
		return;
	}

	// Hashed build assets: cache-first (immutable, safe to pin forever).
	if (isBuildAsset(url)) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						if (response.ok) {
							const clone = response.clone();
							caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
						}
						return response;
					})
			)
		);
		return;
	}

	// Everything else same-origin (icons, fonts, images): stale-while-revalidate.
	event.respondWith(
		caches.match(request).then((cached) => {
			const network = fetch(request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				.catch(() => cached);
			return cached || network;
		})
	);
});
