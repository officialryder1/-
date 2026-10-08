// src/hooks.client.ts
// Register the service worker for PWA functionality.

export const init = () => {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw.js').catch((error) => {
				console.warn('Service worker registration failed:', error);
			});
		});
	}
};
