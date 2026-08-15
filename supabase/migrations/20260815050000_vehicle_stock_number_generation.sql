-- Inventory automation — auto-generated Stock Number.
--
-- Postgres sequences are the canonical concurrency-safe mechanism for
-- this: nextval() is atomic and non-blocking, guaranteed never to return
-- the same value twice even under simultaneous inserts, with no locking
-- required. One sequence per vehicle_type so CAR and MOTORCYCLE numbering
-- are independent, matching the desired CAR-0001/MOT-0001 scheme.
--
-- Existing stock numbers (PM-0001..PM-0006, MP-0001) use a different
-- prefix entirely and are left untouched — both sequences start at 1,
-- so there is no collision risk with anything already in the table.

create sequence public.car_stock_number_seq start 1;
create sequence public.motorcycle_stock_number_seq start 1;

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
    return 'CAR-' || lpad(next_val::text, 4, '0');
  else
    next_val := nextval('public.motorcycle_stock_number_seq');
    return 'MOT-' || lpad(next_val::text, 4, '0');
  end if;
end;
$$;

comment on function public.generate_stock_number(vehicle_type) is
  'Atomically generates the next CAR-XXXX/MOT-XXXX stock number for the given vehicle type. Called via RPC from lib/actions/vehicles.ts:createVehicle — never a frontend MAX()+1 calculation.';

-- Only staff (via their own session, calling through createVehicle) should
-- ever generate a stock number — never anonymous.
revoke execute on function public.generate_stock_number(vehicle_type) from public, anon;
grant execute on function public.generate_stock_number(vehicle_type) to authenticated;
