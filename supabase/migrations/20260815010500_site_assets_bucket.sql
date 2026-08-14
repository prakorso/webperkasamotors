-- Phase 2C Batch 2 — storage bucket for brand assets
--
-- Separate from vehicle-media and content-thumbnails: logos/favicons/OG
-- images aren't vehicle photos. Public-read (they're meant to be visible
-- on the public site), staff-only write.

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "public can read site asset objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-assets');

create policy "staff can upload site asset objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_active_staff());

create policy "staff can update site asset objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_active_staff())
  with check (bucket_id = 'site-assets' and public.is_active_staff());

create policy "staff can delete site asset objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_active_staff());
