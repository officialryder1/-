// Gym House Service Worker
// Caches app shell for offline access and fast repeat visits.

const CACHE_NAME = 'gymhouse-v1';
const APP_SHELL = [
	'/',
	'/auth/signin',
	'/manifest.webmanifest',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

// Install: cache app shell
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(APP_SHELL);
		})
	);
	self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});

// Fetch: network-first with cache fallback for navigations
self.addEventListener('fetch', (event) => {
	const { request } = event;

	// Only handle GET requests
	if (request.method !== 'GET') return;

	// Network-first for navigations (pages)
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful navigations
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache, then to offline page
					return caches.match(request).then((cached) => {
						return cached || caches.match('/');
					});
				})
		);
		return;
	}

	// Cache-first for static assets
	event.respondWith(
		caches.match(request).then((cached) => {
			return cached || fetch(request).then((response) => {
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			});
		})
	);
});
