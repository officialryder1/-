// src/routes/api/shop/products/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProduct, updateProduct, deleteProduct } from '#lib/server/shop';
import { getUserFromSession } from '#lib/server/mock-auth';

export const GET: RequestHandler = async ({ params }) => {
	const product = getProduct(params.id);
	if (!product) {
		return json({ error: 'Product not found' }, { status: 404 });
	}
	return json({ product });
};

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const body = await request.json();
	const { name, description, category, price, image_url, stock_quantity, is_active } = body;

	if (price != null && (typeof price !== 'number' || price < 0)) {
		return json({ error: 'Price must be a non-negative number' }, { status: 400 });
	}

	if (stock_quantity != null && (typeof stock_quantity !== 'number' || stock_quantity < 0 || !Number.isInteger(stock_quantity))) {
		return json({ error: 'Stock quantity must be a non-negative integer' }, { status: 400 });
	}

	const product = updateProduct(params.id, {
		...(name !== undefined && { name }),
		...(description !== undefined && { description }),
		...(category !== undefined && { category }),
		...(price !== undefined && { price }),
		...(image_url !== undefined && { image_url }),
		...(stock_quantity !== undefined && { stock_quantity }),
		...(is_active !== undefined && { is_active })
	});

	if (!product) {
		return json({ error: 'Product not found' }, { status: 404 });
	}

	return json({ product });
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	const sessionToken = cookies.get('gymhouse_session');
	const user = sessionToken ? getUserFromSession(sessionToken) : null;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const deleted = deleteProduct(params.id);
	if (!deleted) {
		return json({ error: 'Product not found' }, { status: 404 });
	}

	return json({ success: true });
};
