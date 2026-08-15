-- Inventory automation — normalize legacy stock number prefixes.
--
-- Investigation findings (see conversation, not repeated in full here):
--   - stock_number exists only on vehicles and stock_number_pool (this
--     migration's predecessor). No other table has a stock_number column,
--     and no FK anywhere references it — leads/content reference vehicles
--     by `id` (uuid), never by stock_number. It is a pure display field.
--   - No CHECK constraint on format, only UNIQUE — renaming is safe from
--     a constraint standpoint, only a collision risk to guard against.
--   - Legacy rows use two prefixes that don't reliably track vehicle_type
--     (PM- appears on both CAR and MOTORCYCLE rows; MP- is a one-off).
--     Prefix is normalized from each row's *current* vehicle_type, not
--     re-derived from the old prefix text.
--
-- Preserves the numeric suffix exactly (PM-0002 -> CAR-0002, not a
-- renumbering) — deliberately not re-sequenced or reordered.
--
-- The one real risk: some legacy numeric suffixes (e.g. PM-0005, PM-0006)
-- are higher than car_stock_number_seq/motorcycle_stock_number_seq's
-- current position, since prior testing already consumed several low
-- numbers without assigning them to real vehicles (documented gaps: see
-- prior migrations' comments). Left unguarded, a future
-- generate_stock_number() call could eventually mint a number that
-- collides with one of these newly-renamed rows. Guarded below by
-- advancing each sequence to at least the highest number now in use for
-- its type, so nextval() can never produce an already-assigned value —
-- this only ever moves a sequence forward, never back, so it can't
-- collide with anything already reclaimed via stock_number_pool either.

update public.vehicles
set stock_number = case vehicle_type
  when 'CAR' then 'CAR-' || substring(stock_number from '\d+$')
  when 'MOTORCYCLE' then 'MOT-' || substring(stock_number from '\d+$')
end
where stock_number ~ '^(PM|MP)-\d+$';

select setval(
  'public.car_stock_number_seq',
  greatest(
    (select last_value from public.car_stock_number_seq),
    coalesce((
      select max(substring(stock_number from '\d+$')::bigint)
      from public.vehicles where vehicle_type = 'CAR'
    ), 0)
  ),
  true
);

select setval(
  'public.motorcycle_stock_number_seq',
  greatest(
    (select last_value from public.motorcycle_stock_number_seq),
    coalesce((
      select max(substring(stock_number from '\d+$')::bigint)
      from public.vehicles where vehicle_type = 'MOTORCYCLE'
    ), 0)
  ),
  true
);
