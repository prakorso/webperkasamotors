-- Phase 2R.6 - Operating System readiness for the vehicle lifecycle.
--
-- PURELY ADDITIVE. Adds the minimum metadata a future Operating System
-- needs (a stable external key, a truthful sold timestamp, a status
-- history) and makes hard-deletion depend on lifecycle HISTORY, not only
-- on the current status. Nothing is dropped, renamed or rewritten; no
-- vehicle id, stock number, slug, price or status value is touched; no
-- fabricated timestamps are written (see section 4).
--
-- STATUS: designed and reviewed, NOT YET APPLIED to the live database.
-- Staging and production share one Supabase project, so applying this is
-- an Owner-authorized action. See docs/reports/phase-2r6-os-readiness.md.
--
-- Application compatibility: the application code on the same branch works
-- both before and after this migration (it never reads or writes the new
-- columns; the lifecycle trigger below populates them), so the order of
-- "apply migration" and "deploy code" is not critical.

-- 1. vehicles: three nullable columns ---------------------------------------

alter table public.vehicles
  add column external_id text,
  add column sold_at timestamptz,
  add column status_changed_at timestamptz;

alter table public.vehicles
  add constraint vehicles_external_id_not_blank
  check (external_id is null or btrim(external_id) <> '');

-- Unique only when present: existing rows stay NULL and never collide.
create unique index vehicles_external_id_key
  on public.vehicles (external_id)
  where external_id is not null;

comment on column public.vehicles.external_id is
  'Stable key linking this vehicle to its record in a future Operating System. Nullable, unique when present, never shown publicly, not edited in the owner form. stock_number must not be used as an integration key.';
comment on column public.vehicles.sold_at is
  'When the vehicle first became SOLD. Set once, by the vehicles_status_lifecycle trigger, on a transition into SOLD. NULL for vehicles that were already SOLD before this column existed (no truthful date is available; created_at/updated_at are NOT used as a substitute).';
comment on column public.vehicles.status_changed_at is
  'Time of the latest status transition, set by the vehicles_status_lifecycle trigger. Distinct from updated_at (any edit). NULL until a vehicle''s status changes after this column was added.';

-- 2. vehicle_status_history -------------------------------------------------

create table public.vehicle_status_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  from_status vehicle_status,
  to_status vehicle_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles (id) on delete set null,
  -- TRUE only for rows seeded by this migration for vehicles that were
  -- already RESERVED or SOLD: they record "this vehicle is known to have
  -- reached this status", NOT when it happened (changed_at is the
  -- migration time). Everything written afterwards has is_baseline = false.
  is_baseline boolean not null default false,
  constraint vehicle_status_history_changed_check check (from_status is distinct from to_status)
);

comment on table public.vehicle_status_history is
  'Append-only log of vehicle status transitions, written only by the vehicles_status_lifecycle trigger. Staff can read it; nobody can edit it through the API. Rows disappear only when a vehicle that never reached RESERVED/SOLD is deleted (ON DELETE CASCADE).';

create index vehicle_status_history_vehicle_idx
  on public.vehicle_status_history (vehicle_id, changed_at desc);

-- Supports the "has this vehicle ever been RESERVED or SOLD?" lookup used by
-- the delete guard. This is why no separate ever_reserved column is needed.
create index vehicle_status_history_commercial_idx
  on public.vehicle_status_history (vehicle_id)
  where to_status in ('RESERVED', 'SOLD');

-- Operational metadata: no public access, staff read-only, no API writes.
alter table public.vehicle_status_history enable row level security;

create policy "staff can read vehicle status history"
  on public.vehicle_status_history for select
  to authenticated
  using (public.is_active_staff());

revoke all on public.vehicle_status_history from anon;
revoke insert, update, delete, truncate on public.vehicle_status_history from authenticated;

-- 3. Lifecycle trigger: timestamps + history, in the same transaction -------
-- Fires only when `status` actually changes. Because it runs inside the
-- UPDATE's own transaction, a status change and its history row either both
-- happen or neither does, no matter which path changed the status (the
-- owner Server Action, archive, the SQL console).

create or replace function public.vehicles_status_lifecycle()
returns trigger
language plpgsql
security definer
-- Empty search_path + schema-qualified names: nothing in this function can
-- be hijacked by an object a caller creates in another schema.
set search_path = ''
as $$
begin
  new.status_changed_at := now();

  if new.status = 'SOLD' and new.sold_at is null then
    new.sold_at := now();
  end if;

  insert into public.vehicle_status_history (vehicle_id, from_status, to_status, changed_at, changed_by)
  values (
    new.id,
    old.status,
    new.status,
    new.status_changed_at,
    -- Only record a user that exists in profiles (NULL for SQL-console / service contexts).
    (select p.id from public.profiles p where p.id = auth.uid())
  );

  return new;
end;
$$;

comment on function public.vehicles_status_lifecycle() is
  'Sets status_changed_at (and sold_at on the first transition into SOLD) and appends a vehicle_status_history row whenever vehicles.status changes.';

create trigger vehicles_status_lifecycle
  before update of status on public.vehicles
  for each row
  when (old.status is distinct from new.status)
  execute function public.vehicles_status_lifecycle();

-- Both functions are trigger functions: nobody needs (or should have) the
-- right to call them. A trigger does not need EXECUTE on its function at fire
-- time, so removing it from every client role is safe and removes the
-- default PUBLIC execute grant.
revoke all on function public.vehicles_status_lifecycle() from public, anon, authenticated;

-- 4. Baseline history for vehicles that are ALREADY reserved or sold --------
-- Without this, a vehicle that is RESERVED today could be returned to
-- AVAILABLE and then deleted, because the history table starts empty.
-- Only to_status/changed_at-as-migration-time are recorded; sold_at and
-- status_changed_at are deliberately left NULL for these rows.

insert into public.vehicle_status_history (vehicle_id, from_status, to_status, is_baseline)
select v.id, null, v.status, true
from public.vehicles v
where v.status in ('RESERVED', 'SOLD');

-- 5. Delete guard: history-aware ---------------------------------------------
-- Replaces the Phase 2 function body (same name, same trigger). A vehicle may
-- not be hard-deleted if it IS reserved/sold now OR EVER was (per history).
-- This also closes the SOLD -> Archived -> Delete path. Vehicles that never
-- reached RESERVED/SOLD behave exactly as before: deletable, stock number
-- released for reuse.

create or replace function public.vehicles_before_delete()
returns trigger
language plpgsql
security definer
-- Hardened from `public` to an empty search_path (all references below are
-- schema-qualified), so object shadowing cannot affect the delete guard.
set search_path = ''
as $$
begin
  if old.status in ('SOLD', 'RESERVED')
     or exists (
       select 1
       from public.vehicle_status_history h
       where h.vehicle_id = old.id
         and h.to_status in ('RESERVED', 'SOLD')
     )
  then
    raise exception
      'Cannot delete vehicle (%): it is, or once was, RESERVED or SOLD, so its stock number is permanently reserved. Archive it instead.',
      old.stock_number
      using errcode = '23514'; -- check_violation, mapped to a friendly message in lib/actions/vehicles.ts
  end if;

  insert into public.stock_number_pool (vehicle_type, stock_number)
  values (old.vehicle_type, old.stock_number);

  return old;
end;
$$;

comment on function public.vehicles_before_delete() is
  'Blocks deletion of any vehicle that is, or ever was, RESERVED or SOLD (current status OR vehicle_status_history), and releases the stock number of any other deleted vehicle into stock_number_pool for reuse.';

revoke all on function public.vehicles_before_delete() from public, anon, authenticated;
