-- Stock number policy: NEVER reuse a stock number.
--
-- OLD BEHAVIOR (migrations 20260815050000 + 20260816010000):
--   * vehicles_before_delete() inserted the stock number of any deleted
--     DRAFT/AVAILABLE/ARCHIVED vehicle into stock_number_pool, with no
--     format check.
--   * generate_stock_number() took the alphabetically first pooled number
--     for the vehicle type before touching the sequence, with no format
--     check. 13 QA/test names sat in the CAR pool, so the next real car
--     would have been numbered QA-PAGN-03 (see
--     docs/reports/stock-number-production-hygiene-audit.md).
--
-- NEW BEHAVIOR:
--   * generate_stock_number() only reads the per-type sequence:
--     CAR-NNNN / MOT-NNNN. nextval() is atomic and non-blocking, so two
--     simultaneous creates can never receive the same number. It refuses to
--     go past 9999 instead of letting lpad() silently truncate the number.
--   * vehicles_before_delete() keeps EXACTLY the same SOLD / RESERVED /
--     "ever SOLD or RESERVED" delete lock, but no longer releases anything.
--     A deleted vehicle's stock number is permanently retired.
--   * vehicles.stock_number must match ^(CAR|MOT)-[0-9]{4}$ on every insert
--     and update, with one explicit, named legacy exception for the two
--     historical non-standard rows (QA-PAGN-01, QA-PAGN-02). They are NOT
--     renamed or otherwise modified here; the exception exists because a
--     plain check would also reject any later UPDATE of those rows.
--   * stock_number_pool stays as an inert legacy table (not read, not
--     written by any function). Its 13 invalid rows are removed by a
--     separate, exact, audited statement, not by this migration.
--
-- CONCEPTUAL ROLLBACK: restore the previous bodies of the two functions
-- (kept in 20260816010000_vehicle_stock_number_reuse_and_safe_delete.sql and
-- 20261001010000_vehicle_lifecycle_os_readiness.sql) and drop the check
-- constraint. Retired numbers would then again be re-poolable.
--
-- Idempotent: CREATE OR REPLACE for the functions; the constraint is only
-- added when absent.

-- 1. Generator: sequence only -----------------------------------------------

create or replace function public.generate_stock_number(v_type vehicle_type)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_val bigint;
begin
  if v_type = 'CAR' then
    next_val := nextval('public.car_stock_number_seq');
    if next_val > 9999 then
      raise exception 'CAR stock number range (CAR-0001..CAR-9999) is exhausted';
    end if;
    return 'CAR-' || lpad(next_val::text, 4, '0');
  else
    next_val := nextval('public.motorcycle_stock_number_seq');
    if next_val > 9999 then
      raise exception 'MOTORCYCLE stock number range (MOT-0001..MOT-9999) is exhausted';
    end if;
    return 'MOT-' || lpad(next_val::text, 4, '0');
  end if;
end;
$$;

comment on function public.generate_stock_number(vehicle_type) is
  'Next CAR-NNNN / MOT-NNNN from the per-type sequence. Stock numbers are never reused: this function does not read stock_number_pool.';

-- 2. Delete guard: same lock, no release ------------------------------------

create or replace function public.vehicles_before_delete()
returns trigger
language plpgsql
security definer
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

  -- Deliberately no release: the stock number of a deleted vehicle is retired for good.
  return old;
end;
$$;

comment on function public.vehicles_before_delete() is
  'Blocks deleting a vehicle that is or ever was RESERVED/SOLD. Deleting any other vehicle permanently retires its stock number (no reuse pool).';

-- 3. Format guard for every future write ------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.vehicles'::regclass
      and conname = 'vehicles_stock_number_format_check'
  ) then
    alter table public.vehicles
      add constraint vehicles_stock_number_format_check
      check (
        stock_number ~ '^(CAR|MOT)-[0-9]{4}$'
        or stock_number in ('QA-PAGN-01', 'QA-PAGN-02')  -- historical rows, kept as-is
      ) not valid;
    alter table public.vehicles validate constraint vehicles_stock_number_format_check;
  end if;
end
$$;

comment on constraint vehicles_stock_number_format_check on public.vehicles is
  'Canonical stock number format CAR-NNNN / MOT-NNNN. QA-PAGN-01 and QA-PAGN-02 are named legacy exceptions and must not be extended.';

-- 4. Legacy pool: kept for history, never used ------------------------------

comment on table public.stock_number_pool is
  'LEGACY. Stock numbers are never reused (migration 20261004010000_retire_stock_number_reuse). Nothing reads or writes this table.';
