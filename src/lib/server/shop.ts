// src/lib/server/shop.ts
// Mock shop data for the Gym House demo.
// In production this is replaced by Supabase queries with RLS.

export interface Product {
	id: string;
	name: string;
	description: string;
	category: string;
	price: number; // in kobo (NGN)
	image_url: string;
	stock_quantity: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface OrderItem {
	id: string;
	order_id: string;
	product_id: string;
	product_name_snapshot: string;
	unit_price_snapshot: number;
	quantity: number;
	line_total: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export interface Order {
	id: string;
	gym_id: string;
	member_id: string;
	status: OrderStatus;
	subtotal: number;
	currency: 'NGN';
	payment_status: PaymentStatus;
	fulfillment_note: string;
	items: OrderItem[];
	created_at: string;
	updated_at: string;
}

// --- seed data ---

const seedProducts: Product[] = [
	{
		id: 'prod-1',
		name: 'Gym House Water Bottle',
		description: '750ml insulated steel bottle. Keeps water cold for 24 hours.',
		category: 'Accessories',
		price: 8500,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Bottle',
		stock_quantity: 25,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-2',
		name: 'Gym House Towel',
		description: 'Quick-dry microfibre towel. 120×60cm.',
		category: 'Accessories',
		price: 4200,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Towel',
		stock_quantity: 40,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-3',
		name: 'Resistance Band Set',
		description: 'Set of 3 bands (light, medium, heavy).',
		category: 'Equipment',
		price: 12000,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Bands',
		stock_quantity: 15,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-4',
		name: 'Gym House T-Shirt',
		description: 'Cotton blend training shirt. S–XXL.',
		category: 'Apparel',
		price: 6500,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Shirt',
		stock_quantity: 30,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-5',
		name: 'Protein Shaker',
		description: '600ml shaker with storage compartment.',
		category: 'Accessories',
		price: 5500,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Shaker',
		stock_quantity: 20,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-6',
		name: 'Jump Rope',
		description: 'Adjustable speed rope with ball bearings.',
		category: 'Equipment',
		price: 3800,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Rope',
		stock_quantity: 18,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-7',
		name: 'Gym Bag',
		description: '40L duffel with shoe compartment.',
		category: 'Accessories',
		price: 15000,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Bag',
		stock_quantity: 12,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'prod-8',
		name: 'Wrist Wraps',
	 description: 'Pair of 18" elastic wrist wraps.',
		category: 'Equipment',
		price: 3200,
		image_url: 'https://placehold.co/400x400/1a1a2e/eef1f5?text=Wraps',
		stock_quantity: 35,
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	}
];

// --- globalThis store (survives Vite HMR) ---

const SHOP_KEY = Symbol.for('gymhouse.shop');

interface ShopStore {
	products: Product[];
	orders: Order[];
}

function shopStore(): ShopStore {
	const g = globalThis as unknown as Record<symbol, ShopStore | undefined>;
	if (!g[SHOP_KEY]) {
		g[SHOP_KEY] = {
			products: seedProducts.map(p => ({ ...p })),
			orders: []
		};
	}
	return g[SHOP_KEY]!;
}

// --- product operations ---

export function listProducts(): Product[] {
	return shopStore().products.filter(p => p.is_active);
}

export function listAllProducts(): Product[] {
	return shopStore().products;
}

export function getProduct(id: string): Product | null {
	return shopStore().products.find(p => p.id === id) ?? null;
}

export function createProduct(data: {
	name: string;
	description: string;
	category: string;
	price: number;
	image_url: string;
	stock_quantity: number;
	is_active: boolean;
}): Product {
	const store = shopStore();
	const product: Product = {
		...data,
		id: crypto.randomUUID(),
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};
	store.products.push(product);
	return product;
}

export function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'created_at'>>): Product | null {
	const store = shopStore();
	const idx = store.products.findIndex(p => p.id === id);
	if (idx === -1) return null;
	store.products[idx] = { ...store.products[idx], ...data, updated_at: new Date().toISOString() };
	return store.products[idx];
}

export function deleteProduct(id: string): boolean {
	const store = shopStore();
	const idx = store.products.findIndex(p => p.id === id);
	if (idx === -1) return false;
	store.products.splice(idx, 1);
	return true;
}

// --- order operations ---

export function createOrder(
	memberId: string,
	gymId: string,
	items: { productId: string; quantity: number }[]
): { order: Order } | { error: string } {
	const store = shopStore();

	if (items.length === 0) return { error: 'Cart is empty' };

	// Validate stock
	for (const item of items) {
		const product = store.products.find(p => p.id === item.productId);
		if (!product) return { error: `Product ${item.productId} not found` };
		if (!product.is_active) return { error: `${product.name} is no longer available` };
		if (product.stock_quantity < item.quantity) {
			return { error: `Only ${product.stock_quantity} × ${product.name} in stock` };
		}
	}

	// Build order items and calculate total
	let subtotal = 0;
	const orderItems: OrderItem[] = [];

	for (const item of items) {
		const product = store.products.find(p => p.id === item.productId)!;
		const lineTotal = product.price * item.quantity;
		subtotal += lineTotal;

		orderItems.push({
			id: crypto.randomUUID(),
			order_id: '',
			product_id: product.id,
			product_name_snapshot: product.name,
			unit_price_snapshot: product.price,
			quantity: item.quantity,
			line_total: lineTotal
		});

		// Decrement stock
		product.stock_quantity -= item.quantity;
		product.updated_at = new Date().toISOString();
	}

	const order: Order = {
		id: `GH-${String(store.orders.length + 1042).padStart(4, '0')}`,
		gym_id: gymId,
		member_id: memberId,
		status: 'pending',
		subtotal,
		currency: 'NGN',
		payment_status: 'unpaid',
		fulfillment_note: 'Pay at gym',
		items: orderItems,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	for (const item of orderItems) {
		item.order_id = order.id;
	}

	store.orders.push(order);
	return { order };
}

export function listOrdersForMember(memberId: string): Order[] {
	return shopStore().orders.filter(o => o.member_id === memberId);
}

export function listAllOrders(): Order[] {
	return shopStore().orders;
}

export function getOrder(orderId: string): Order | null {
	return shopStore().orders.find(o => o.id === orderId) ?? null;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
	const store = shopStore();
	const order = store.orders.find(o => o.id === orderId);
	if (!order) return null;
	order.status = status;
	order.updated_at = new Date().toISOString();
	return order;
}
