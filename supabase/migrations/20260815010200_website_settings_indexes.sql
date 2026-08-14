-- Phase 2C Batch 2 — indexes

create index navigation_items_placement_sort_idx
  on public.navigation_items (placement, sort_order);

create index navigation_items_visible_idx
  on public.navigation_items (is_visible) where is_visible = true;
