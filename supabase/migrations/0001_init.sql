-- ============================================================================
-- Gym House — initial schema, RLS, and constraints
-- Migration 0001_init
--
-- NOT APPLIED YET. This project has no Supabase instance by design: the demo
-- runs on the mock layer (src/lib/server/*.ts) until a client buys.
-- Apply with:  node scripts/apply-migration.mjs supabase/migrations/0001_init.sql
--
-- Mirrors the mock data model exactly so the app swap is mechanical:
--   gyms, profiles, subscription_plans, subscriptions, attendance_sessions,
--   member_qr_tokens, products, orders, order_items, audit_logs
--
-- Business rules enforced here (not just in app code):
--   * RLS on every table (privacy by role)
--   * one open attendance session per member per gym  (partial unique index)
--   * QR tokens stored as SHA-256 hashes only        (never plaintext)
--   * order items snapshot price + name              (history survives edits)
--   * audit_logs append-only to staff, readable by admin
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (idempotent)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('member', 'receptionist', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'expired', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum
    ('pending', 'active', 'expired', 'cancelled', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('paystack', 'manual', 'pay_at_gym');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending', 'confirmed', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.gyms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'Africa/Lagos',
  created_at  timestamptz not null default now()
);

-- Extends auth.users. Created by trigger on signup (see bottom).
create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  gym_id                   uuid references public.gyms (id) on delete set null,
  email                    text not null,
  full_name                text not null default '',
  role                     public.user_role not null default 'member',
  membership_status        public.membership_status not null default 'active',
  subscription_expires_at  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists profiles_gym_id_idx on public.profiles (gym_id);
create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.subscription_plans (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gyms (id) on delete cascade,
  name           text not null,
  description    text not null default '',
  price          integer not null check (price >= 0),   -- kobo (NGN minor unit)
  duration_days  integer not null check (duration_days >= 1),
  features       text[] not null default '{}',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists plans_gym_id_idx on public.subscription_plans (gym_id);

create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  gym_id             uuid not null references public.gyms (id) on delete cascade,
  member_id          uuid not null references public.profiles (id) on delete cascade,
  plan_id            uuid not null references public.subscription_plans (id) on delete restrict,
  starts_at          timestamptz not null default now(),
  expires_at         timestamptz not null,
  status             public.subscription_status not null default 'pending',
  payment_status     public.payment_status not null default 'unpaid',
  payment_method     public.payment_method not null default 'pay_at_gym',
  payment_reference  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists subscriptions_member_idx on public.subscriptions (member_id);
create index if not exists subscriptions_gym_status_idx on public.subscriptions (gym_id, status);

create table if not exists public.attendance_sessions (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms (id) on delete cascade,
  member_id     uuid not null references public.profiles (id) on delete cascade,
  check_in_at   timestamptz not null default now(),
  check_out_at  timestamptz
);
create index if not exists attendance_member_idx on public.attendance_sessions (member_id);
create index if not exists attendance_gym_idx on public.attendance_sessions (gym_id, check_in_at desc);

-- BUSINESS RULE 4: one open session per member per gym.
create unique index if not exists attendance_one_open_per_member
  on public.attendance_sessions (gym_id, member_id)
  where check_out_at is null;

-- QR tokens are stored HASHED. The plaintext never touches the database.
create table if not exists public.member_qr_tokens (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles (id) on delete cascade,
  token_hash  text not null unique,          -- sha256 hex of the pass secret
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index if not exists qr_tokens_member_idx on public.member_qr_tokens (member_id);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms (id) on delete cascade,
  name         text not null,
  description  text not null default '',
  price        integer not null check (price >= 0),   -- kobo
  stock        integer not null default 0 check (stock >= 0),
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_gym_idx on public.products (gym_id);

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms (id) on delete cascade,
  member_id   uuid not null references public.profiles (id) on delete cascade,
  status      public.order_status not null default 'pending',
  subtotal    integer not null default 0 check (subtotal >= 0),   -- kobo
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists orders_member_idx on public.orders (member_id);
create index if not exists orders_gym_status_idx on public.orders (gym_id, status);

-- Snapshot price + name so editing a product never rewrites history.
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  name_snapshot   text not null,
  price_snapshot  integer not null check (price_snapshot >= 0),
  quantity        integer not null check (quantity >= 1),
  line_total      integer not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid references public.gyms (id) on delete set null,
  actor_id    uuid references public.profiles (id) on delete set null,
  actor_name  text not null default '',
  actor_role  text not null default '',
  action      text not null,
  entity      text not null default '',
  summary     text not null default '',
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_gym_created_idx on public.audit_logs (gym_id, created_at desc);
create index if not exists audit_action_idx on public.audit_logs (action);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','subscription_plans','subscriptions','products','orders']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER: read profiles without recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_gym_id() returns uuid
language sql stable security definer set search_path = public as $$
  select gym_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- admin OR receptionist — the people who operate the door and the desk
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','receptionist') from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on everything
-- ---------------------------------------------------------------------------
alter table public.gyms                enable row level security;
alter table public.profiles            enable row level security;
alter table public.subscription_plans  enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.member_qr_tokens    enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.audit_logs          enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- gyms: any authenticated user may see their own gym; admin may update it.
drop policy if exists gyms_read on public.gyms;
create policy gyms_read on public.gyms for select to authenticated
  using (id = public.current_gym_id());

drop policy if exists gyms_admin_update on public.gyms;
create policy gyms_admin_update on public.gyms for update to authenticated
  using (id = public.current_gym_id() and public.is_admin())
  with check (id = public.current_gym_id() and public.is_admin());

-- profiles: read own; staff read the gym roster; admin writes.
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_staff_read on public.profiles for select to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role::text = public.current_user_role());  -- cannot self-promote

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin() and gym_id = public.current_gym_id())
  with check (public.is_admin() and gym_id = public.current_gym_id());

-- subscription_plans: everyone in the gym reads; admin writes.
drop policy if exists plans_read on public.subscription_plans;
create policy plans_read on public.subscription_plans for select to authenticated
  using (gym_id = public.current_gym_id());

drop policy if exists plans_admin_write on public.subscription_plans;
create policy plans_admin_write on public.subscription_plans for all to authenticated
  using (public.is_admin() and gym_id = public.current_gym_id())
  with check (public.is_admin() and gym_id = public.current_gym_id());

-- subscriptions: member reads own; staff read gym; admin writes; member may
-- create their OWN subscription only.
drop policy if exists subs_read_own on public.subscriptions;
create policy subs_read_own on public.subscriptions for select to authenticated
  using (member_id = auth.uid());

drop policy if exists subs_staff_read on public.subscriptions;
create policy subs_staff_read on public.subscriptions for select to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id());

drop policy if exists subs_member_insert on public.subscriptions;
create policy subs_member_insert on public.subscriptions for insert to authenticated
  with check (member_id = auth.uid() and gym_id = public.current_gym_id());

drop policy if exists subs_admin_write on public.subscriptions;
create policy subs_admin_write on public.subscriptions for all to authenticated
  using (public.is_admin() and gym_id = public.current_gym_id())
  with check (public.is_admin() and gym_id = public.current_gym_id());

-- attendance_sessions: member reads own; staff read + write the gym's.
drop policy if exists attendance_read_own on public.attendance_sessions;
create policy attendance_read_own on public.attendance_sessions for select to authenticated
  using (member_id = auth.uid());

drop policy if exists attendance_staff_read on public.attendance_sessions;
create policy attendance_staff_read on public.attendance_sessions for select to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id());

drop policy if exists attendance_staff_write on public.attendance_sessions;
create policy attendance_staff_write on public.attendance_sessions for all to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id())
  with check (public.is_staff() and gym_id = public.current_gym_id());

-- member_qr_tokens: member reads own; staff read gym; staff write.
drop policy if exists qr_read_own on public.member_qr_tokens;
create policy qr_read_own on public.member_qr_tokens for select to authenticated
  using (member_id = auth.uid());

drop policy if exists qr_staff_write on public.member_qr_tokens;
create policy qr_staff_write on public.member_qr_tokens for all to authenticated
  using (
    public.is_staff()
    and exists (select 1 from public.profiles p
                where p.id = member_qr_tokens.member_id and p.gym_id = public.current_gym_id())
  )
  with check (
    public.is_staff()
    and exists (select 1 from public.profiles p
                where p.id = member_qr_tokens.member_id and p.gym_id = public.current_gym_id())
  );

-- products: all gym members read; admin writes.
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated
  using (gym_id = public.current_gym_id());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all to authenticated
  using (public.is_admin() and gym_id = public.current_gym_id())
  with check (public.is_admin() and gym_id = public.current_gym_id());

-- orders: member reads own; staff read gym; member creates own; staff update.
drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders for select to authenticated
  using (member_id = auth.uid());

drop policy if exists orders_staff_read on public.orders;
create policy orders_staff_read on public.orders for select to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id());

drop policy if exists orders_member_insert on public.orders;
create policy orders_member_insert on public.orders for insert to authenticated
  with check (member_id = auth.uid() and gym_id = public.current_gym_id());

drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update on public.orders for update to authenticated
  using (public.is_staff() and gym_id = public.current_gym_id())
  with check (public.is_staff() and gym_id = public.current_gym_id());

-- order_items: visible when the parent order is visible.
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.member_id = auth.uid()
             or (public.is_staff() and o.gym_id = public.current_gym_id()))
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.member_id = auth.uid()
             or (public.is_staff() and o.gym_id = public.current_gym_id()))
    )
  );

-- audit_logs: append-only. Staff insert; admin reads. No update/delete policy
-- exists, so nobody can rewrite history — that is the point.
drop policy if exists audit_staff_insert on public.audit_logs;
create policy audit_staff_insert on public.audit_logs for insert to authenticated
  with check (public.is_staff() and gym_id = public.current_gym_id());

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated
  using (public.is_admin() and gym_id = public.current_gym_id());

-- ---------------------------------------------------------------------------
-- New signup -> profile row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
