#!/usr/bin/env node
// scripts/verify-rls-behavior.mjs
// Full RLS behaviour suite: DENY list (must be blocked) + ALLOW list (must work).
// A fix that blocks everything is as broken as one that blocks nothing, so both
// directions are asserted. Exits non-zero on any failure (CI-able).
//
//   node scripts/verify-rls-behavior.mjs

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
grant usage on schema public, auth to anon, authenticated;
`;

const GRANTS = `
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
`;

const GYM = '00000000-0000-0000-0000-000000000001';
const GYM2 = '00000000-0000-0000-0000-00000000000a';
const MEMBER = '00000000-0000-0000-0000-000000000002';
const OTHER = '00000000-0000-0000-0000-00000000000b';
const ADMIN = '00000000-0000-0000-0000-00000000000c';
const PLAN = '00000000-0000-0000-0000-000000000003';
const PROD = '00000000-0000-0000-0000-000000000004';

const db = new PGlite();
const pass = [];
const fail = [];

async function actAs(uid) {
	await db.exec(`reset role;`);
	await db.exec(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${uid}"}', false);`);
}

// expect: 'allow' | 'deny'
async function check(label, expect, sql, opts = {}) {
	await actAs(opts.as ?? MEMBER);
	let rows = 0;
	let err = null;
	try {
		const r = await db.query(sql);
		rows = r.affectedRows ?? 0;
		if (opts.expectValue !== undefined) {
			const v = r.rows?.[0]?.v;
			if (String(v) !== String(opts.expectValue)) {
				fail.push(`${label} — expected value ${opts.expectValue}, got ${v}`);
				await db.exec(`reset role;`);
				return;
			}
		}
	} catch (e) {
		err = e.message;
	}
	await db.exec(`reset role;`);

	const blocked = err !== null;
	// A denied UPDATE/DELETE/SELECT shows up as 0 rows affected, NOT an error
	// (RLS filters silently). So for a 'deny' expectation, zero rows = denied.
	const denied = blocked || (expect === 'deny' && rows === 0);
	const ok = expect === 'deny' ? denied : !denied;
	(ok ? pass : fail).push(
		`${label} [${expect}${ok ? ' OK' : ' *** WRONG ***'}]${err ? ' :: ' + err.slice(0, 46) : ''}`
	);
}

try {
	await db.exec(STUBS);
	for (const f of readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort())
		await db.exec(readFileSync(join(migDir, f), 'utf8'));
	await db.exec(GRANTS);

	await db.exec(`
		insert into public.gyms (id, name) values ('${GYM}','Test Gym'), ('${GYM2}','Other Gym');
		insert into auth.users (id, email) values
			('${MEMBER}','m@test.com'), ('${OTHER}','o@test.com'), ('${ADMIN}','a@test.com');
		update public.profiles set gym_id='${GYM}', role='member', membership_status='expired' where id='${MEMBER}';
		update public.profiles set gym_id='${GYM}', role='member' where id='${OTHER}';
		update public.profiles set gym_id='${GYM}', role='admin'  where id='${ADMIN}';
		insert into public.subscription_plans (id, gym_id, name, price, duration_days)
		  values ('${PLAN}','${GYM}','Unlimited',55000,30);
		insert into public.products (id, gym_id, name, price, stock)
		  values ('${PROD}','${GYM}','Shaker',5000,10);
	`);

	// ---------------- DENY ----------------
	await check('A self-issue active+paid subscription', 'deny', `insert into public.subscriptions
		(gym_id, member_id, plan_id, expires_at, status, payment_status, payment_method)
		values ('${GYM}','${MEMBER}','${PLAN}', now()+interval '10 years','active','paid','paystack')`);

	await check('B direct order insert (must use RPC)', 'deny', `insert into public.orders
		(gym_id, member_id, subtotal) values ('${GYM}','${MEMBER}', 0)`);

	await check('C move self to another gym', 'deny', `update public.profiles
		set gym_id='${GYM2}' where id='${MEMBER}'`);

	await check('D flip own membership_status', 'deny', `update public.profiles
		set membership_status='active' where id='${MEMBER}'`);

	await check('E self-promote to admin', 'deny', `update public.profiles
		set role='admin' where id='${MEMBER}'`);

	await check('F delete attendance history', 'deny', `delete from public.attendance_sessions
		where member_id='${MEMBER}'`);

	await check('G read another member profile', 'deny',
		`select count(*)::int v from public.profiles where id='${OTHER}'`,
		{ expectValue: 0 });

	await check('H oversell via RPC (qty 999 > stock 10)', 'deny',
		`select public.create_order('[{"productId":"${PROD}","quantity":999}]')`);

	await check('I self-mark paid via update', 'deny', `update public.subscriptions
		set payment_status='paid' where member_id='${MEMBER}'`);

	// ---------------- ALLOW ----------------
	await check('J member renames self', 'allow', `update public.profiles
		set full_name='Alice Renamed' where id='${MEMBER}'`);

	await check('K member requests PENDING subscription', 'allow', `insert into public.subscriptions
		(gym_id, member_id, plan_id, expires_at, status, payment_status, payment_method)
		values ('${GYM}','${MEMBER}','${PLAN}', now()+interval '30 days','pending','unpaid','pay_at_gym')`);

	await check('L member orders via RPC (priced from DB)', 'allow',
		`select public.create_order('[{"productId":"${PROD}","quantity":2}]')`);

	await check('M admin sets member membership_status', 'allow', `update public.profiles
		set membership_status='active' where id='${MEMBER}'`, { as: ADMIN });

	await check('N admin reads audit log', 'allow',
		`select count(*)::int v from public.audit_logs`, { as: ADMIN, expectValue: 0 });

	// ---------------- value assertions ----------------
	const subtotal = await db.query(`select subtotal::int v from public.orders order by created_at desc limit 1`);
	const stock = await db.query(`select stock::int v from public.products where id='${PROD}'`);
	console.log(`order subtotal (expect 10000 = 2 x 5000): ${subtotal.rows[0]?.v}`);
	console.log(`stock after order  (expect 8):            ${stock.rows[0]?.v}`);
	const priceOk = subtotal.rows[0]?.v === 10000 && stock.rows[0]?.v === 8;

	console.log('\n' + '='.repeat(74));
	for (const p of pass) console.log('  PASS  ' + p);
	for (const f of fail) console.log('  FAIL  ' + f);
	console.log('='.repeat(74));
	console.log(`${pass.length} passed, ${fail.length} failed` + (priceOk ? '' : '  (PRICE/STOCK MISMATCH)'));

	if (fail.length || !priceOk) process.exit(1);
	console.log('RESULT: PASS — RLS blocks escalation and still allows legitimate use');
} catch (e) {
	console.error('suite error:', e.message);
	process.exit(1);
}
