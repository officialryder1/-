#!/usr/bin/env node
// scripts/validate-migration.mjs
//
// Applies supabase/migrations/*.sql against PGlite (Postgres compiled to WASM)
// with a minimal `auth` schema stub, so the SQL is actually EXECUTED — not just
// eyeballed. Catches syntax errors, bad policy references, and reserved-word
// collisions before you ever touch a real project.
//
// This does NOT provision anything and needs no Supabase keys.
//
//   node scripts/validate-migration.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const migDir = resolve(root, 'supabase/migrations');

// --- minimal stubs Supabase provides but vanilla Postgres does not ---
const STUBS = `
create schema if not exists auth;
create schema if not exists extensions;

-- Supabase's auth.uid(): reads the JWT claim. Stubbed to NULL here.
-- gen_random_uuid() is core Postgres 13+, so pgcrypto is not required.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function auth.uid() returns uuid
language sql stable as $$ select null::uuid $$;

-- Roles Supabase defines
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
`;

const db = new PGlite();

function fail(msg) {
	console.error('FAIL:', msg);
	process.exit(1);
}

try {
	await db.exec(STUBS);
	console.log('stubs: auth schema + roles ready');

	const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
	if (!files.length) fail('no .sql files in supabase/migrations');

	for (const f of files) {
		const sql = readFileSync(join(migDir, f), 'utf8');
		try {
			await db.exec(sql);
			console.log(`applied: ${f}`);
		} catch (e) {
			fail(`${f} -> ${e.message}`);
		}
	}

	// --- structural assertions ---
	const expectTables = [
		'gyms', 'profiles', 'subscription_plans', 'subscriptions',
		'attendance_sessions', 'member_qr_tokens', 'products', 'orders',
		'order_items', 'audit_logs'
	];
	const { rows: tables } = await db.query(
		`select tablename from pg_tables where schemaname = 'public'`
	);
	const have = new Set(tables.map((r) => r.tablename));
	for (const t of expectTables) {
		if (!have.has(t)) fail(`table public.${t} missing`);
	}
	console.log(`tables: ${expectTables.length}/${expectTables.length} present`);

	// RLS enabled everywhere
	const { rows: rls } = await db.query(`
		select c.relname, c.relrowsecurity
		from pg_class c join pg_namespace n on n.oid = c.relnamespace
		where n.nspname = 'public' and c.relkind = 'r'
	`);
	const noRls = rls.filter((r) => !r.relrowsecurity).map((r) => r.relname);
	if (noRls.length) fail(`RLS not enabled on: ${noRls.join(', ')}`);
	console.log(`RLS: enabled on all ${rls.length} public tables`);

	// Policies exist
	const { rows: pol } = await db.query(
		`select tablename, count(*)::int as n from pg_policies where schemaname='public' group by 1`
	);
	const totalPolicies = pol.reduce((s, r) => s + r.n, 0);
	if (totalPolicies < 20) fail(`only ${totalPolicies} policies — expected 20+`);
	console.log(`policies: ${totalPolicies} across ${pol.length} tables`);

	// Business rule 4: partial unique index
	const { rows: idx } = await db.query(`
		select indexname from pg_indexes
		where schemaname='public' and indexname = 'attendance_one_open_per_member'
	`);
	if (!idx.length) fail('one-open-session partial unique index missing');
	console.log('rule 4: attendance_one_open_per_member index present');

	// audit_logs must have NO update/delete policy (append-only)
	const { rows: auditWrite } = await db.query(`
		select cmd from pg_policies
		where schemaname='public' and tablename='audit_logs' and cmd in ('UPDATE','DELETE')
	`);
	if (auditWrite.length) fail('audit_logs has an UPDATE/DELETE policy — must be append-only');
	console.log('rule 12: audit_logs is append-only (no UPDATE/DELETE policy)');

	// --- behavioural: partial unique index actually blocks a 2nd open session ---
	const gym = '00000000-0000-0000-0000-000000000001';
	const member = '00000000-0000-0000-0000-000000000002';
	// Inserting the auth user fires on_auth_user_created -> profile row is created
	// automatically. Then attach the gym (as admin onboarding would).
	await db.exec(`insert into auth.users (id, email) values ('${member}', 'm@test.com');
		insert into public.gyms (id, name) values ('${gym}', 'Test Gym');
		update public.profiles set gym_id = '${gym}' where id = '${member}';
		insert into public.attendance_sessions (gym_id, member_id) values ('${gym}', '${member}');`);

	// prove the trigger produced exactly one profile
	const { rows: trig } = await db.query(
		`select count(*)::int as n from public.profiles where id = '${member}'`
	);
	if (trig[0].n !== 1) fail(`signup trigger produced ${trig[0].n} profiles, expected 1`);
	console.log('trigger: on_auth_user_created created exactly 1 profile');
	let blocked = false;
	try {
		await db.exec(
			`insert into public.attendance_sessions (gym_id, member_id) values ('${gym}', '${member}');`
		);
	} catch {
		blocked = true;
	}
	if (!blocked) fail('second OPEN session was allowed — rule 4 NOT enforced');
	console.log('rule 4: second open session correctly REJECTED');

	// closing then reopening must succeed
	await db.exec(`update public.attendance_sessions set check_out_at = now()
		where gym_id='${gym}' and member_id='${member}' and check_out_at is null;`);
	await db.exec(
		`insert into public.attendance_sessions (gym_id, member_id) values ('${gym}', '${member}');`
	);
	console.log('rule 4: reopen after check-out correctly ALLOWED');

	// price/stock checks
	let negBlocked = false;
	try {
		await db.exec(`insert into public.products (gym_id, name, price, stock)
			values ('${gym}', 'Bad', 100, -5);`);
	} catch {
		negBlocked = true;
	}
	if (!negBlocked) fail('negative stock accepted — rule 10 NOT enforced');
	console.log('rule 10: negative stock correctly REJECTED');

	console.log('\nRESULT: PASS — migration executes and rules are enforced');
} catch (e) {
	fail(e.message);
}
