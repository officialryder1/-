// src/lib/stores/cart.ts
// Client-side cart store with localStorage persistence.

import { writable, get } from 'svelte/store';
import { browser } from '$app/env';

export interface CartItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
}

const CART_KEY = 'gymhouse_cart';

function loadCart(): CartItem[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(CART_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartItem[]) {
	if (!browser) return;
	localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export const cart = writable<CartItem[]>(loadCart());

export function addToCart(productId: string, name: string, price: number, quantity: number = 1) {
	cart.update(items => {
		const existing = items.find(i => i.productId === productId);
		if (existing) {
			return items.map(i =>
				i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
			);
		}
		return [...items, { productId, name, price, quantity }];
	});
	saveCart(get(cart));
}

export function updateCartQuantity(productId: string, quantity: number) {
	cart.update(items => {
		if (quantity <= 0) return items.filter(i => i.productId !== productId);
		return items.map(i => (i.productId === productId ? { ...i, quantity } : i));
	});
	saveCart(get(cart));
}

export function removeFromCart(productId: string) {
	cart.update(items => items.filter(i => i.productId !== productId));
	saveCart(get(cart));
}

export function clearCart() {
	cart.set([]);
	saveCart([]);
}

export function getCartTotal(items: CartItem[]): number {
	return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function getCartCount(items: CartItem[]): number {
	return items.reduce((sum, i) => sum + i.quantity, 0);
}
