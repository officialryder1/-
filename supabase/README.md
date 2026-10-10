# Supabase — ready-to-apply (NOT provisioned yet)

This project runs on a **mock data layer** (`src/lib/server/*.ts`, `globalThis`-backed)
with **no Supabase instance**. That is deliberate: nothing is provisioned until a
client buys. Everything here is prepared so go-live is a short, mechanical swap.

## Why this exists

The mock layer works on a long-lived Node server but **not** on Vercel serverless
functions — instances are recycled and not shared, so a cold start resets all state
and two concurrent instances see different data. For a pitch demo that's survivable;
for a real client it is not. This directory is the fix, ready to run.

## What's here

```
supabase/migrations/0001_init.sql   full schema + RLS + constraints (idempotent)
scripts/apply-migration.mjs         Management-API migration runner
.env.example                        the keys you'll need
```

## Go-live checklist (≈15 minutes)

### 1. Provision the project
Create a Supabase project (any region; `af-south-1` / `eu-west-2` are closest for NG).
Then copy `.env.example` → `.env` and fill in:

| Key | Where | Used by |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Settings → API | app + runner |
| `PUBLIC_SUPABASE_ANON_KEY` | Settings → API | browser/server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API | admin client in app code (RLS bypass) |
| `SUPABASE_ACCESS_TOKEN` | Account → Access Tokens | **migrations only** |

> `sb_secret_…` (service role) is for app code. `sbp_…` (access token) is for the
> migration runner. Do not swap them — a migration with the service-role key fails.

### 2. Apply the schema
```bash
node scripts/apply-migration.mjs supabase/migrations/0001_init.sql
```
Prefer the dashboard? Paste the same file into **SQL Editor → Run**. Both are equivalent.

### 3. Verify RLS actually isolates tenants
Do **not** skip this — it's the whole point of the policies.
1. Create a QA user with the admin client (`admin.auth.admin.createUser`, `email_confirm: true`).
2. Bootstrap their gym + profile with the admin client (bypasses RLS).
3. Sign in with the **anon** client → get a session.
4. Query as a **brand-new** anon client (no session, `persistSession: false`).
   It must return **0 rows**. If you reuse the signed-up client it will see its own
   row — that is correct behaviour, not a leak. Fresh client or the test lies.

### 4. Swap the data layer
Each mock module maps 1:1 to a table, so the swap is mechanical:

| Mock module | Replace with |
|---|---|
| `src/lib/server/mock-auth.ts` | Supabase Auth + `profiles` |
| `src/lib/server/plans.ts` | `subscription_plans`, `subscriptions` |
| `src/lib/server/attendance.ts` | `attendance_sessions` |
| `src/lib/server/shop.ts` | `products`, `orders`, `order_items` |
| `src/lib/server/audit.ts` | `audit_logs` |

Add:
- `src/lib/supabase/client.ts` — browser client (`@supabase/ssr`)
- `src/lib/supabase/server.ts` — request-scoped + admin client
- `src/hooks.server.ts` — session → `event.locals`

> **Service-role import pitfall:** use the namespace import
> `import { env } from '$env/dynamic/private'; const K = env.SUPABASE_SERVICE_ROLE_KEY;`
> A named import throws `MISSING_EXPORT` under rolldown.

### 5. Migrate demo users
The five demo accounts (see `docs/DEMO_GUIDE.md`) become real auth users. Recreate
them with `admin.auth.admin.createUser`, then set `profiles.role` and `gym_id`.
Change every demo password before sharing anything publicly.

## Business rules already enforced in SQL

| # | Rule | Mechanism |
|---|---|---|
| 1 | Only eligible members enter | `check_in` reads `profiles.membership_status` |
| 4 | No duplicate open sessions | partial unique index `attendance_one_open_per_member` |
| 5 | Check-out requires a session | app-level (`check_out_at is null` lookup) |
| 6 | Staff actions recorded | `audit_logs` insert policy, staff-only |
| 7 | Members see only their own records | RLS `member_id = auth.uid()` |
| 8 | Admin scoped to their gym | every policy pins `gym_id = current_gym_id()` |
| 10 | No oversell | `products.stock >= 0` check |
| 12 | All state changes auditable | append-only `audit_logs` (no update/delete policy) |
| 14 | No PII in QR secrets | `member_qr_tokens.token_hash` stores SHA-256 only |

## Security notes

- `audit_logs` has **no update or delete policy** — history cannot be rewritten. Intentional.
- `profiles_self_update` blocks self-promotion (`role = current_user_role()`).
- RLS helpers are `SECURITY DEFINER` to avoid infinite recursion when a policy on
  `profiles` needs to read `profiles`.
- Rotate the service-role key if it is ever exposed; it bypasses every policy here.

## Security fixes — `0002_security_fixes.sql` (2026-10-10)

`0001_init.sql` had **four confirmed privilege-escalation holes**. Its insert/update
policies checked only *who* a row belonged to (`member_id = auth.uid()`), never *what
values* were being written — and `WITH CHECK` must pin the privilege-bearing columns.

| Hole | Attack | Fix |
|---|---|---|
| **A** | Member self-inserted an `active`+`paid` subscription → free membership | Insert policy now requires `status='pending'`, `payment_status in ('unpaid','pending')`, `payment_reference is null` |
| **B** | Member created an order with `subtotal = 0` → free goods | Direct `INSERT` revoked; orders go through `create_order(jsonb)` RPC which prices from `products` and deducts stock with `FOR UPDATE` |
| **C** | Member moved self to another `gym_id` → tenant escape | `protect_profile_columns()` BEFORE UPDATE trigger blocks `gym_id` changes |
| **D** | Member flipped own `membership_status` → self-reactivate | Same trigger blocks `membership_status` / `subscription_expires_at` |

The trigger (not a `WITH CHECK`) is used for C/D because it has both `OLD` and `NEW`,
so it can compare exactly what changed — and it avoids the infinite recursion a
self-referential `WITH CHECK` on `profiles` would cause.

## Verification (no Supabase instance needed)

All three scripts run against **PGlite** (Postgres compiled to WASM) and need no keys:

```bash
node scripts/validate-migration.mjs    # schema applies; constraints & rules enforced
node scripts/verify-rls-behavior.mjs   # 14 assertions: escalation DENIED, legit use ALLOWED
node scripts/probe-rls-holes.mjs       # adversarial: impersonate a member, report affected rows
```

`verify-rls-behavior.mjs` is the regression gate — it asserts **both** directions, because
a policy that blocks everything is as broken as one that blocks nothing. Exit code 1 on
any failure, so it can run in CI.

> **Testing pitfall (cost an hour to find):** `SET LOCAL` does **not** survive across
> PGlite calls — each call is its own transaction — so an impersonation probe using it
> silently runs as the **table owner**, who bypasses RLS entirely and reports every
> attack as "exploited". Use session-level `set role authenticated` +
> `set_config('request.jwt.claims', …, false)`. Also: grants must run **after** the
> migration, or `grant … on all tables` matches zero tables. Always assert the acting
> role (`current_user`) before trusting a result.
