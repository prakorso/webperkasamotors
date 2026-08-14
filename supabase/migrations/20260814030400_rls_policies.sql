-- Phase 2B — row level security
--
-- RLS is the actual access boundary — the anon/publishable key is safe to
-- expose to the browser because of these policies, not despite them.
-- Matches docs/PHASE-2-SUPABASE-PLAN.md section F exactly. No table is
-- fully open to `anon` for writes except `leads` (insert-only), and no
-- table is fully open to `anon` for reads except the already-filtered
-- vehicles / vehicle_media / content.

alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;
alter table public.leads enable row level security;
alter table public.content enable row level security;
alter table public.profiles enable row level security;

-- vehicles ------------------------------------------------------------
-- Two SELECT policies stack with OR: the public one only ever exposes
-- published, publicly-relevant-status vehicles; the staff one additionally
-- exposes everything (drafts, archived, unpublished) to active staff.

create policy "public can read published vehicles"
  on public.vehicles for select
  to anon, authenticated
  using (is_published = true and status in ('AVAILABLE', 'RESERVED', 'SOLD'));

create policy "staff can read all vehicles"
  on public.vehicles for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert vehicles"
  on public.vehicles for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update vehicles"
  on public.vehicles for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete vehicles"
  on public.vehicles for delete
  to authenticated
  using (public.is_active_staff());

-- vehicle_media -----------------------------------------------------------
create policy "public can read media for public vehicles"
  on public.vehicle_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.vehicles
      where vehicles.id = vehicle_media.vehicle_id
        and vehicles.is_published = true
        and vehicles.status in ('AVAILABLE', 'RESERVED', 'SOLD')
    )
  );

create policy "staff can read all media"
  on public.vehicle_media for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert media"
  on public.vehicle_media for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update media"
  on public.vehicle_media for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete media"
  on public.vehicle_media for delete
  to authenticated
  using (public.is_active_staff());

-- leads -------------------------------------------------------------------
-- Insert-only for the public: this is what lets the Contact/Inquiry forms
-- write without ever letting a visitor read another visitor's submission.
create policy "anyone can submit a lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

create policy "staff can read leads"
  on public.leads for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can update leads"
  on public.leads for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete leads"
  on public.leads for delete
  to authenticated
  using (public.is_active_staff());

-- content -------------------------------------------------------------
-- Public sees only PUBLISHED content. Which vehicle it's shown for is an
-- application-level query filter (getSocialContentForVehicle already adds
-- .eq('vehicle_id', vehicleId)), not an RLS concern — published, unlinked
-- editorial content is legitimately public too.
create policy "public can read published content"
  on public.content for select
  to anon, authenticated
  using (status = 'PUBLISHED');

create policy "staff can read all content"
  on public.content for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert content"
  on public.content for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update content"
  on public.content for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete content"
  on public.content for delete
  to authenticated
  using (public.is_active_staff());

-- profiles ------------------------------------------------------------
-- No anon access at all. Staff can always read their own row (needed to
-- resolve their own role/active state in the app); OWNER/ADMIN can read
-- and manage everyone else's.

create policy "staff can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "owners and admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() in ('OWNER', 'ADMIN'));

create policy "owners and admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() in ('OWNER', 'ADMIN'))
  with check (public.current_user_role() in ('OWNER', 'ADMIN'));

-- No insert/delete policy on profiles for anyone: rows are created only by
-- the on_auth_user_created trigger (SECURITY DEFINER, bypasses RLS) and
-- removed only via the auth.users cascade. This is deliberate — profiles
-- should never be created or deleted through the public API.
