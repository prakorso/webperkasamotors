-- Phase 4.x — Vehicle Detail UX: two new Basic Information fields.
--
-- Purely additive — no existing column touched/renamed. Audited the live
-- `vehicles` table first (information_schema.columns): neither field
-- existed under any name.

alter table public.vehicles
  add column capacity_cc integer null,
  add column plate_number text null;

comment on column public.vehicles.capacity_cc is 'Engine capacity in CC, numeric only (e.g. 155) — the UI appends "CC" when displaying it, the admin never types the unit.';
comment on column public.vehicles.plate_number is 'Free-text plate representation exactly as the admin wants it shown publicly (e.g. "B Jakarta") — never parsed, validated against a region table, or auto-formatted.';

alter table public.vehicles
  add constraint vehicles_capacity_cc_check check (capacity_cc is null or capacity_cc > 0);
