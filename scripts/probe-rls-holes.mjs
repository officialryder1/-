#!/usr/bin/env node
// scripts/probe-rls-holes.mjs
// Adversarial probe: impersonate a plain MEMBER and try to escalate.
//
// CRITICAL: uses session-level `set role` + `set_config(..., false)`.
// `SET LOCAL` does NOT persist across pglite calls (each call is its own
// transaction) and the table OWNER bypasses RLS entirely — so a SET LOCAL
// probe silently runs as owner and reports every attempt as "exploited".
//
// Reports ACTUAL AFFECTED ROWS, so a DELETE/UPDATE matching nothing is not
// mistaken for a breach.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const migDir = resolve(root, 'supabase/migrations');

const STUBS = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub','')::uuid
$$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
`;

// Applied AFTER the migration: tables must exist before `grant ... on all tables`.
const GRANTS = `
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
`;

const GYM = '00000000-0000-0000-0000-000000000001';
const GYM2 = '00000000-0000-0000-0000-00000000000a'; // a REAL second gym (not an FK error)
const MEMBER = '00000000-0000-0000-0000-000000000002';
const PLAN = '00000000-0000-0000-0000-000000000003';
const PROD = '00000000-0000-0000-0000-000000000004';

const db = new PGlite();
const results = [];

// Assume the member identity for the WHOLE session (not just one tx).
async function actAsMember() {
	await db.exec(`reset role;`);
	await db.exec(
		`set role authenticated;
		 select set_config('request.jwt.claims', '{"sub":"${MEMBER}"}', false);`
	);
}

// Run `sql` as the member; report affected row count and the acting role.
async function asMember(label, sql) {
	await actAsMember();
	try {
		const r = await db.query(sql);
		results.push({ label, exploited: r.affectedRows > 0, rows: r.affectedRows, err: null });
	} catch (e) {
		results.push({ label, exploited: false, rows: 0, err: e.message });
	} finally {
		await db.exec(`reset role;`);
	}
}

try {
	await db.exec(STUBS);
	const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
	for (const f of files) await db.exec(readFileSync(join(migDir, f), 'utf8'));
	await db.exec(GRANTS); // tables now exist → grant privileges

	await db.exec(`
		insert into public.gyms (id, name) values ('${GYM}', 'Test Gym'), ('${GYM2}', 'Other Gym');
		insert into auth.users (id, email) values ('${MEMBER}', 'm@test.com');
		update public.profiles set gym_id='${GYM}', role='member', membership_status='expired'
		  where id='${MEMBER}';
		insert into public.subscription_plans (id, gym_id, name, price, duration_days)
		  values ('${PLAN}', '${GYM}', 'Unlimited', 55000, 30);
		insert into public.products (id, gym_id, name, price, stock)
		  values ('${PROD}', '${GYM}', 'Shaker', 5000, 10);
		insert into public.attendance_sessions (gym_id, member_id) values ('${GYM}','${MEMBER}');
	`);

	// sanity: prove the impersonation is real before trusting any result
	await actAsMember();
	const who = await db.query(`select current_user cu, auth.uid() uid`);
	const vis = await db.query(`select count(*)::int n from public.profiles`);
	const me = await db.query(`select count(*)::int n from public.profiles where id = auth.uid()`);
	await db.exec(`reset role;`);
	console.log(`impersonation check: current_user=${who.rows[0].cu} auth.uid()=${who.rows[0].uid}`);
	console.log(`visibility: member can see ${me.rows[0].n} own profile / ${vis.rows[0].n} total rows`);
	if (who.rows[0].cu !== 'authenticated') {
		throw new Error('impersonation failed — results would be meaningless');
	}
	console.log('seed: 2 gyms + member + plan + product + 1 attendance row\n');

	await asMember('A. self-issue ACTIVE+PAID subscription', `insert into public.subscriptions
		(gym_id, member_id, plan_id, expires_at, status, payment_status, payment_method)
		values ('${GYM}','${MEMBER}','${PLAN}', now() + interval '10 years',
		        'active','paid','paystack')`);

	await asMember('B. create order with subtotal = 0', `insert into public.orders
		(gym_id, member_id, subtotal) values ('${GYM}','${MEMBER}', 0)`);

	await asMember('C. move self to another gym_id', `update public.profiles
		set gym_id = '${GYM2}' where id = '${MEMBER}'`);

	await asMember('D. flip own membership_status (expired->active)', `update public.profiles
		set membership_status='active' where id='${MEMBER}'`);

	await asMember('E. delete attendance history', `delete from public.attendance_sessions
		where member_id='${MEMBER}'`);

	await asMember('F. rename self (full_name) - should be ALLOWED', `update public.profiles
		set full_name='Hacked Name' where id='${MEMBER}'`);

	console.log('hole                                            exploited?  rows   detail');
	console.log('-'.repeat(88));
	for (const r of results) {
		const verdict = r.exploited ? 'YES  <-- HOLE' : 'no';
		console.log(`${r.label.padEnd(46)} ${verdict.padEnd(11)} ${String(r.rows).padEnd(6)} ${(r.err || '').slice(0, 30)}`);
	}
	console.log('\n(F = control: must be ALLOWED for a member to edit their own name.)');
} catch (e) {
	console.error('probe failed:', e.message);
	process.exit(1);
}
