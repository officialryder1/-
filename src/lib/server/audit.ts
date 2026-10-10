// #lib/server/audit.ts
// Audit log for Gym House demo (business rules 6 & 12: all staff actions recorded).
// In production this is a Supabase `audit_logs` table written inside the same
// transaction as the action it records.

export type AuditAction =
	| 'sign_in'
	| 'sign_out'
	| 'subscription.created'
	| 'subscription.suspended'
	| 'subscription.reactivated'
	| 'subscription.cancelled'
	| 'plan.created'
	| 'plan.updated'
	| 'plan.deleted'
	| 'product.created'
	| 'product.updated'
	| 'product.deleted'
	| 'order.created'
	| 'order.status_changed'
	| 'member.checked_in'
	| 'member.checked_out';

export interface AuditEntry {
	id: string;
	at: string; // ISO timestamp
	actor_id: string;
	actor_name: string;
	actor_role: string;
	action: AuditAction;
	entity: string; // e.g. 'subscription:sub-123'
	summary: string; // human-readable
	meta: Record<string, unknown>;
}

export interface AuditInput {
	actor: { id: string; full_name: string; role: string };
	action: AuditAction;
	entity: string;
	summary: string;
	meta?: Record<string, unknown>;
}

const AUDIT_KEY = Symbol.for('gymhouse.audit');
const MAX_ENTRIES = 500;

function log(): AuditEntry[] {
	const g = globalThis as unknown as Record<symbol, AuditEntry[] | undefined>;
	if (!g[AUDIT_KEY]) {
		g[AUDIT_KEY] = seed();
	}
	return g[AUDIT_KEY]!;
}

/**
 * Record an action. Never throws — an audit failure must not break the action
 * it is recording (log-and-continue), but in production it should fail the
 * transaction so no state change goes unrecorded.
 */
export function record(input: AuditInput): AuditEntry {
	const entry: AuditEntry = {
		id: crypto.randomUUID(),
		at: new Date().toISOString(),
		actor_id: input.actor.id,
		actor_name: input.actor.full_name,
		actor_role: input.actor.role,
		action: input.action,
		entity: input.entity,
		summary: input.summary,
		meta: input.meta ?? {}
	};

	const entries = log();
	entries.unshift(entry); // newest first
	if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
	return entry;
}

export function listAudit(limit = 100): AuditEntry[] {
	return log().slice(0, limit);
}

export function auditStats(): { total: number; today: number; byAction: Record<string, number> } {
	const entries = log();
	const today = new Date().toISOString().slice(0, 10);
	const byAction: Record<string, number> = {};
	for (const e of entries) {
		byAction[e.action] = (byAction[e.action] ?? 0) + 1;
	}
	return {
		total: entries.length,
		today: entries.filter((e) => e.at.slice(0, 10) === today).length,
		byAction
	};
}

// --- demo seed so the audit view is not empty on first load ---
function seed(): AuditEntry[] {
	const now = Date.now();
	const mk = (
		minsAgo: number,
		actor: { id: string; full_name: string; role: string },
		action: AuditAction,
		entity: string,
		summary: string
	): AuditEntry => ({
		id: crypto.randomUUID(),
		at: new Date(now - minsAgo * 60_000).toISOString(),
		actor_id: actor.id,
		actor_name: actor.full_name,
		actor_role: actor.role,
		action,
		entity,
		summary,
		meta: {}
	});

	const admin = { id: 'admin-1', full_name: 'Sarah Manager', role: 'admin' };
	const reception = { id: 'reception-1', full_name: 'Reception Staff', role: 'receptionist' };

	return [
		mk(12, reception, 'member.checked_in', 'member:member-1', 'Alice Johnson checked in'),
		mk(28, reception, 'member.checked_out', 'member:member-3', 'Chloe Martin checked out'),
		mk(45, admin, 'subscription.reactivated', 'subscription:sub-104', 'Reactivated Premium for Bob Chen'),
		mk(90, admin, 'plan.updated', 'plan:premium', 'Premium price updated to ₦300'),
		mk(140, reception, 'member.checked_in', 'member:member-3', 'Chloe Martin checked in'),
		mk(210, admin, 'product.created', 'product:prod-009', 'Added "Resistance Bands Set" to shop'),
		mk(300, admin, 'subscription.suspended', 'subscription:sub-091', 'Suspended Basic for Dan Okoro'),
		mk(420, admin, 'sign_in', 'user:admin-1', 'Sarah Manager signed in')
	];
}
