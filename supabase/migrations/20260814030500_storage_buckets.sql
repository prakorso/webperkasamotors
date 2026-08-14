-- Phase 2B — storage buckets
--
-- Two public-read buckets, matching docs/PHASE-2-SUPABASE-PLAN.md section D.
-- Both are public because vehicle photos and content thumbnails are meant
-- to be publicly visible on the site — no signed URLs needed for either.

insert into storage.buckets (id, name, public)
values
  ('vehicle-media', 'vehicle-media', true),
  ('content-thumbnails', 'content-thumbnails', true)
on conflict (id) do nothing;

-- vehicle-media -------------------------------------------------------
-- storage.objects RLS: bucket-level `public = true` already lets objects
-- be fetched by URL; these policies additionally cover listing/query
-- access through the Storage API and gate all writes to active staff.

create policy "public can read vehicle media objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'vehicle-media');

create policy "staff can upload vehicle media objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'vehicle-media' and public.is_active_staff());

create policy "staff can update vehicle media objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'vehicle-media' and public.is_active_staff())
  with check (bucket_id = 'vehicle-media' and public.is_active_staff());

create policy "staff can delete vehicle media objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'vehicle-media' and public.is_active_staff());

-- content-thumbnails --------------------------------------------------
create policy "public can read content thumbnail objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'content-thumbnails');

create policy "staff can upload content thumbnail objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'content-thumbnails' and public.is_active_staff());

create policy "staff can update content thumbnail objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'content-thumbnails' and public.is_active_staff())
  with check (bucket_id = 'content-thumbnails' and public.is_active_staff());

create policy "staff can delete content thumbnail objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'content-thumbnails' and public.is_active_staff());
