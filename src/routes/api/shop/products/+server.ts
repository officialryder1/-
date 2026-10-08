// src/routes/api/shop/products/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listProducts, createProduct } from '#lib/server/shop';
import { getUserFromSession } from '#lib/server/mock-auth';

export const GET: RequestHandler = async () => {
	return json({ products: listProducts() });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	if (!name || !description || !category || price == null || stock_quantity == null) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (typeof price !== 'number' || price < 0) {
		return json({ error: 'Price must be a non-negative number' }, { status: 400 });
	}

	if (typeof stock_quantity !== 'number' || stock_quantity < 0 || !Number.isInteger(stock_quantity)) {
		return json({ error: 'Stock quantity must be a non-negative integer' }, { status: 400 });
	}

	const product = createProduct({
		name,
		description,
		category,
		price,
		image_url: image_url || '',
		stock_quantity,
		is_active: is_active ?? true
	});

	return json({ product }, { status: 201 });
};
