-- Inventory automation — stock number reuse on delete, with a database-
-- level lock preventing SOLD/RESERVED vehicles from ever being deleted.
--
-- Business rule (explicit): deleting a DRAFT/AVAILABLE/ARCHIVED vehicle
-- may free its stock number for reuse by a future vehicle. Deleting a
-- SOLD or RESERVED vehicle must never be possible — those numbers stay
-- permanently locked, since they correspond to real transactions/holds.
--
-- This is enforced with a BEFORE DELETE trigger directly on `vehicles`,
-- not in application code — so it holds no matter which path a delete
-- comes through (the app's Server Action, a direct PostgREST call, the
-- SQL console), matching the existing "staff can delete vehicles" RLS
-- policy that already technically permits deletes today but that no
-- code path currently calls.
--
-- Reuse itself goes through a small pool table rather than resetting the
-- sequence — sequences are deliberately not reused/rolled back (that's
-- what makes nextval() concurrency-safe with zero locking). Reclaiming a
-- pool row uses SELECT ... FOR UPDATE SKIP LOCKED, so two vehicles being
-- created at the same instant can never be handed the same reclaimed
-- number: whichever transaction locks the row first wins it, and the
-- other simply skips to the next available row (or falls through to
-- nextval() if the pool is empty).

create table public.stock_number_pool (
  id uuid primary key default gen_random_uuid(),
  vehicle_type vehicle_type not null,
  stock_number text not null unique,
  released_at timestamptz not null default now()
);

comment on table public.stock_number_pool is
  'Stock numbers released by deleting a DRAFT/AVAILABLE/ARCHIVED vehicle, available for generate_stock_number() to hand out again before it advances the sequence. Populated only by vehicles_before_delete(); consumed only by generate_stock_number().';

alter table public.stock_number_pool enable row level security;

-- No public/staff policies at all: this table is bookkeeping for two
-- SECURITY DEFINER functions, never queried directly by the app. RLS
-- enabled with no policies means even staff sessions can't read/write it
-- directly through PostgREST — only generate_stock_number() and
-- vehicles_before_delete() (both SECURITY DEFINER) can touch it.

create or replace function public.generate_stock_number(v_type vehicle_type)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
  reclaimed text;
  reclaimed_id uuid;
begin
  -- Prefer a reclaimed number over minting a new one. FOR UPDATE SKIP
  -- LOCKED makes this safe under concurrent creates: a second caller
  -- racing for the same row never blocks and never doubles up — it just
  -- moves on to the next reclaimed row, or nextval() if none are left.
  select id, stock_number into reclaimed_id, reclaimed
  from public.stock_number_pool
  where vehicle_type = v_type
  order by stock_number asc
  for update skip locked
  limit 1;

  if reclaimed is not null then
    delete from public.stock_number_pool where id = reclaimed_id;
    return reclaimed;
  end if;

  if v_type = 'CAR' then
    next_val := nextval('public.car_stock_number_seq');
    return 'CAR-' || lpad(next_val::text, 4, '0');
  else
    next_val := nextval('public.motorcycle_stock_number_seq');
    return 'MOT-' || lpad(next_val::text, 4, '0');
  end if;
end;
$$;

comment on function public.generate_stock_number(vehicle_type) is
  'Atomically generates the next CAR-XXXX/MOT-XXXX stock number for the given vehicle type: reclaims a released number from stock_number_pool first (FOR UPDATE SKIP LOCKED — concurrency-safe reuse), otherwise mints a fresh one via nextval(). Called via RPC from lib/actions/vehicles.ts:createVehicle — never a frontend MAX()+1 calculation.';

create or replace function public.vehicles_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status in ('SOLD', 'RESERVED') then
    raise exception
      'Cannot delete a % vehicle (%). Its stock number is permanently reserved and cannot be freed. Archive it instead.',
      OLD.status, OLD.stock_number
      using errcode = '23514'; -- check_violation, mapped to a friendly message in lib/actions/vehicles.ts
  end if;

  insert into public.stock_number_pool (vehicle_type, stock_number)
  values (OLD.vehicle_type, OLD.stock_number);

  return OLD;
end;
$$;

comment on function public.vehicles_before_delete() is
  'Blocks deletion of SOLD/RESERVED vehicles at the database level (not just the UI) and releases the stock number of any other deleted vehicle into stock_number_pool for reuse.';

create trigger vehicles_before_delete
  before delete on public.vehicles
  for each row
  execute function public.vehicles_before_delete();
