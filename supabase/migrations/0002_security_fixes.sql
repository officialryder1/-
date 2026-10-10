-- ============================================================================
-- Gym House — security fixes for RLS holes found by adversarial probing
-- Migration 0002_security_fixes
--
-- NOT APPLIED YET (no Supabase instance by design — see supabase/README.md).
-- Apply AFTER 0001_init.sql.
--
-- Every hole below was CONFIRMED with scripts/probe-rls-holes.mjs, which
-- impersonates a plain member via session-level `set role authenticated` +
-- `set_config('request.jwt.claims', …, false)` and reports affected rows.
--
--   HOLE A  member self-issued an active+paid subscription  (free membership)
--   HOLE B  member created an order with subtotal = 0        (free goods)
--   HOLE C  member moved self to another gym_id              (tenant escape)
--   HOLE D  member flipped own membership_status             (self-reactivate)
--
-- Root cause: 0001's insert/update policies checked only WHO the row belonged
-- to (`member_id = auth.uid()`), never WHICH VALUES were being written. RLS
-- WITH CHECK must pin the privilege-bearing columns, not just ownership.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- FIX C + D: profiles — members may edit their own details, never their
-- privileges. A BEFORE UPDATE trigger has both OLD and NEW, so it can compare
-- exactly what changed without the recursion a self-referential WITH CHECK
-- would cause.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- No end-user JWT => server / service-role context (migrations, admin tooling).
  -- Those are trusted; only constrain authenticated end users.
  if auth.uid() is null then
    return new;
  end if;

  -- Admins legitimately manage membership state for their gym.
  if public.is_admin() then
    return new;
  end if;

  if new.id                       is distinct from old.id
     or new.email                 is distinct from old.email
     or new.role                  is distinct from old.role
     or new.gym_id                is distinct from old.gym_id
     or new.membership_status     is distinct from old.membership_status
     or new.subscription_expires_at is distinct from old.subscription_expires_at
  then
    raise exception 'profile fields (role, gym, membership, email) are not self-editable'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Keep the ownership check on the policy too (defence in depth).
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- FIX A: subscriptions — a member may request a subscription, but never
-- mark it paid/active. Payment is confirmed by the server (Paystack webhook or
-- staff action), which is exactly business rule 2.
-- ---------------------------------------------------------------------------
drop policy if exists subs_member_insert on public.subscriptions;
create policy subs_member_insert on public.subscriptions for insert to authenticated
  with check (
    member_id = auth.uid()
    and gym_id = public.current_gym_id()
    and status = 'pending'                          -- cannot self-activate
    and payment_status in ('unpaid', 'pending')     -- cannot self-mark paid
    and payment_reference is null                   -- cannot forge a reference
  );

-- ---------------------------------------------------------------------------
-- FIX B (+ rules 9 & 10): orders — members must not set their own price or
-- status. Route order creation through a SECURITY DEFINER RPC that prices from
-- the products table and deducts stock atomically. Direct INSERT is revoked so
-- the RPC is the only path.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p_items jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_gym      uuid;
  v_order    uuid;
  v_subtotal integer := 0;
  it         jsonb;
  v_qty      integer;
  v_prod     record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  select gym_id into v_gym from public.profiles where id = auth.uid();
  if v_gym is null then
    raise exception 'member has no gym' using errcode = 'insufficient_privilege';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items must be a non-empty array' using errcode = 'check_violation';
  end if;

  insert into public.orders (gym_id, member_id, status, subtotal)
  values (v_gym, auth.uid(), 'pending', 0)
  returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((it ->> 'quantity')::int, 0);
    if v_qty < 1 then
      raise exception 'quantity must be >= 1' using errcode = 'check_violation';
    end if;

    -- FOR UPDATE serialises concurrent buyers of the same product (rule 10).
    select id, name, price, stock into v_prod
    from public.products
    where id = (it ->> 'productId')::uuid
      and gym_id = v_gym
      and is_active
    for update;

    if not found then
      raise exception 'product not found or inactive' using errcode = 'no_data_found';
    end if;

    if v_prod.stock < v_qty then
      raise exception 'insufficient stock for %', v_prod.name using errcode = 'check_violation';
    end if;

    update public.products set stock = stock - v_qty where id = v_prod.id;

    -- Price snapshot taken from the DB, never from the client (rule 9).
    insert into public.order_items
      (order_id, product_id, name_snapshot, price_snapshot, quantity, line_total)
    values
      (v_order, v_prod.id, v_prod.name, v_prod.price, v_qty, v_prod.price * v_qty);

    v_subtotal := v_subtotal + v_prod.price * v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal where id = v_order;
  return v_order;
end $$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to authenticated;

-- Close the direct-write path that hole B used.
drop policy if exists orders_member_insert on public.orders;
drop policy if exists order_items_insert on public.order_items;
revoke insert on public.orders from authenticated;
revoke insert on public.order_items from authenticated;
