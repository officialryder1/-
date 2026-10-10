// src/lib/server/plans.ts
// Mock plans & subscriptions data for the Gym House demo.
// In production this is replaced by Supabase queries with RLS.

export interface Plan {
	id: string;
	gym_id: string;
	name: string;
	description: string;
	price: number; // in kobo (NGN)
	duration_days: number;
	features: string[];
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';

export interface Subscription {
	id: string;
	gym_id: string;
	member_id: string;
	plan_id: string;
	starts_at: string;
	expires_at: string;
	status: SubscriptionStatus;
	payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded';
	payment_method: 'paystack' | 'manual' | 'pay_at_gym';
	payment_reference: string | null;
	created_at: string;
	updated_at: string;
}

// --- seed data ---

const seedPlans: Plan[] = [
	{
		id: 'plan-1',
		gym_id: 'gym-house-001',
		name: 'Basic',
		description: 'Access to gym floor and basic equipment.',
		price: 15000,
		duration_days: 30,
		features: ['Gym floor access', 'Locker room', '1 guest pass/month'],
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'plan-2',
		gym_id: 'gym-house-001',
		name: 'Premium',
		description: 'Full access including classes and sauna.',
		price: 30000,
		duration_days: 30,
		features: ['Everything in Basic', 'Unlimited classes', 'Sauna & steam room', '2 guest passes/month'],
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'plan-3',
		gym_id: 'gym-house-001',
		name: 'Unlimited',
		description: 'All-inclusive with personal training sessions.',
		price: 55000,
		duration_days: 30,
		features: ['Everything in Premium', '2 PT sessions/month', 'Priority booking', 'Free merchandise'],
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	},
	{
		id: 'plan-4',
		gym_id: 'gym-house-001',
		name: 'Student',
		description: 'Discounted plan for valid student ID holders.',
		price: 10000,
		duration_days: 30,
		features: ['Gym floor access', 'Locker room', 'Valid student ID required'],
		is_active: true,
		created_at: '2026-09-01T10:00:00Z',
		updated_at: '2026-09-01T10:00:00Z'
	}
];

// --- globalThis store (survives Vite HMR) ---

const PLANS_KEY = Symbol.for('gymhouse.plans');

interface PlansStore {
	plans: Plan[];
	subscriptions: Subscription[];
}

function plansStore(): PlansStore {
	const g = globalThis as unknown as Record<symbol, PlansStore | undefined>;
	if (!g[PLANS_KEY]) {
		g[PLANS_KEY] = {
			plans: seedPlans.map(p => ({ ...p })),
			subscriptions: seedSubscriptions()
		};
	}
	return g[PLANS_KEY]!;
}

/**
 * Demo subscriptions so the admin views (revenue, plan mix, member status) are
 * not empty on first load. Dates are relative to "now" so the demo never goes
 * stale — member-1/2/3 are the three demo members from mock-auth.
 */
function seedSubscriptions(): Subscription[] {
	const now = Date.now();
	const days = (n: number) => new Date(now + n * 86_400_000).toISOString();
	const ago = (n: number) => new Date(now - n * 86_400_000).toISOString();

	return [
		{
			id: 'sub-101',
			gym_id: 'gym-house-001',
			member_id: 'member-1', // Alice — active Unlimited
			plan_id: 'plan-3',
			starts_at: ago(12),
			expires_at: days(18),
			status: 'active',
			payment_status: 'paid',
			payment_method: 'paystack',
			payment_reference: 'PAY-9F2C41A7',
			created_at: ago(12),
			updated_at: ago(12)
		},
		{
			id: 'sub-102',
			gym_id: 'gym-house-001',
			member_id: 'member-2', // Bob — expired Basic
			plan_id: 'plan-1',
			starts_at: ago(75),
			expires_at: ago(45),
			status: 'expired',
			payment_status: 'paid',
			payment_method: 'pay_at_gym',
			payment_reference: null,
			created_at: ago(75),
			updated_at: ago(45)
		},
		{
			id: 'sub-103',
			gym_id: 'gym-house-001',
			member_id: 'member-3', // Chloe — active Premium
			plan_id: 'plan-2',
			starts_at: ago(20),
			expires_at: days(10),
			status: 'active',
			payment_status: 'paid',
			payment_method: 'paystack',
			payment_reference: 'PAY-1B77E0D3',
			created_at: ago(20),
			updated_at: ago(20)
		}
	];
}

// --- plan operations ---

export function listPlans(): Plan[] {
	return plansStore().plans.filter(p => p.is_active);
}

export function listAllPlans(): Plan[] {
	return plansStore().plans;
}

export function getPlan(id: string): Plan | null {
	return plansStore().plans.find(p => p.id === id) ?? null;
}

export function createPlan(data: {
	name: string;
	description: string;
	price: number;
	duration_days: number;
	features: string[];
	is_active: boolean;
}): Plan {
	const store = plansStore();
	const plan: Plan = {
		...data,
		id: crypto.randomUUID(),
		gym_id: 'gym-house-001',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};
	store.plans.push(plan);
	return plan;
}

export function updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'gym_id' | 'created_at'>>): Plan | null {
	const store = plansStore();
	const idx = store.plans.findIndex(p => p.id === id);
	if (idx === -1) return null;
	store.plans[idx] = { ...store.plans[idx], ...data, updated_at: new Date().toISOString() };
	return store.plans[idx];
}

export function deletePlan(id: string): boolean {
	const store = plansStore();
	const idx = store.plans.findIndex(p => p.id === id);
	if (idx === -1) false;
	store.plans.splice(idx, 1);
	return true;
}

// --- subscription operations ---

export function getActiveSubscription(memberId: string): Subscription | null {
	const store = plansStore();
	const now = new Date();
	return store.subscriptions.find(
		s => s.member_id === memberId && s.status === 'active' && new Date(s.expires_at) > now
	) ?? null;
}

export function getSubscriptionHistory(memberId: string): Subscription[] {
	return plansStore().subscriptions.filter(s => s.member_id === memberId);
}

export function getAllSubscriptions(): Subscription[] {
	return plansStore().subscriptions;
}

export function createSubscription(
	memberId: string,
	planId: string,
	paymentMethod: 'paystack' | 'manual' | 'pay_at_gym'
): { subscription: Subscription } | { error: string } {
	const store = plansStore();
	const plan = store.plans.find(p => p.id === planId);
	if (!plan) return { error: 'Plan not found' };
	if (!plan.is_active) return { error: 'Plan is not active' };

	// Check for existing active subscription
	const existing = getActiveSubscription(memberId);
	if (existing) {
		return { error: 'You already have an active subscription' };
	}

	const now = new Date();
	const expires = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

	const subscription: Subscription = {
		id: crypto.randomUUID(),
		gym_id: 'gym-house-001',
		member_id: memberId,
		plan_id: planId,
		starts_at: now.toISOString(),
		expires_at: expires.toISOString(),
		status: 'active',
		payment_status: paymentMethod === 'pay_at_gym' ? 'unpaid' : 'paid',
		payment_method: paymentMethod,
		payment_reference: paymentMethod === 'pay_at_gym' ? null : `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
		created_at: now.toISOString(),
		updated_at: now.toISOString()
	};

	store.subscriptions.push(subscription);
	return { subscription };
}

export function cancelSubscription(subscriptionId: string): Subscription | null {
	const store = plansStore();
	const sub = store.subscriptions.find(s => s.id === subscriptionId);
	if (!sub) return null;
	sub.status = 'cancelled';
	sub.updated_at = new Date().toISOString();
	return sub;
}

export function updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Subscription | null {
	const store = plansStore();
	const sub = store.subscriptions.find(s => s.id === subscriptionId);
	if (!sub) return null;
	sub.status = status;
	sub.updated_at = new Date().toISOString();
	return sub;
}
