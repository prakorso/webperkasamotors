-- Phase 2C Batch 2 — follow-up fix
--
-- navigation_items had no unique constraint besides its random-UUID `id`,
-- which meant seed.sql's `on conflict do nothing` could never actually
-- match anything — re-running the seed would silently duplicate every
-- row. This also happens to be a reasonable data-integrity rule on its
-- own (no two identical label+href pairs in the same placement).

alter table public.navigation_items
  add constraint navigation_items_placement_label_href_key
  unique (placement, label, href);
