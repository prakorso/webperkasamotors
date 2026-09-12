-- CMS for the public /about ("Tentang Kami") page.
--
-- Audit finding (see the accompanying implementation report): the
-- existing `content` table is NOT a general-purpose editorial table — its
-- own comment ("Instagram/editorial content") and its
-- content_type/status enums (STOCK/REVIEW/REEL/... and
-- INBOX/CLASSIFIED/PUBLISHED/IGNORED) show it exists specifically for
-- vehicle-linked social media posts (lib/actions/content.ts,
-- SocialContentStrip). Reusing it for About page copy would conflate two
-- unrelated concepts and violate this task's own instruction to keep
-- them separate. `articles` is likewise a distinct domain (dated,
-- slugged, SEO blog posts) — About is a single fixed page, not a post
-- collection.
--
-- What About page copy actually is: a small set of named, orderable,
-- independently-publishable sections on one fixed page. That's exactly
-- the shape `homepage_benefits` and `testimonials` already use
-- (20260815040000_homepage_cms.sql) — a genuine one-to-many list gets its
-- own small table with is_active + sort_order, staff-write/public-read
-- RLS. Unlike Hero/homepage-About/Why-Perkasa (singleton fields bolted
-- onto website_settings because there's exactly one of each), About page
-- content is explicitly meant to grow (Team, History, Standards, Closing
-- CTA, per the brief) — a real table means adding a future section is a
-- new row (and a small admin fieldset), never another schema migration
-- bolting on more website_settings columns.
--
-- section_key is a stable slug ("hero", "story", ...) the public page and
-- admin form key off of, unique so each named section can only exist
-- once. Free-form beyond that — a future section just picks a new key,
-- no enum to extend.

create table public.about_page_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  eyebrow text null,
  headline text null,
  body text null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint about_page_sections_section_key_key unique (section_key)
);

comment on table public.about_page_sections is
  'CMS content for the public /about ("Tentang Kami") page. One row per named section (section_key), e.g. "hero", "story". Public rendering requires is_active = true; an inactive or empty section is simply omitted from the page, never shown as a placeholder.';
comment on column public.about_page_sections.section_key is
  'Stable identifier the public page and admin form key off of. Adding a future About section (Team, History, Standards, ...) is a new row with a new key, not a schema change.';
comment on column public.about_page_sections.body is
  'Plain text, rendered as paragraphs on blank lines — same convention as articles.content (see components/public/article-content.tsx, reused as-is for this table).';

alter table public.about_page_sections enable row level security;

create policy "public can read active about page sections"
  on public.about_page_sections for select
  to anon, authenticated
  using (is_active = true);

create policy "staff can read all about page sections"
  on public.about_page_sections for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert about page sections"
  on public.about_page_sections for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update about page sections"
  on public.about_page_sections for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete about page sections"
  on public.about_page_sections for delete
  to authenticated
  using (public.is_active_staff());

-- Reuses the existing set_updated_at() trigger function (already used by
-- website_settings and articles) rather than defining a new one.
create trigger about_page_sections_set_updated_at
  before update on public.about_page_sections
  for each row execute function public.set_updated_at();

-- No extra index: this table only ever holds a small, fixed handful of
-- named sections (a handful today, still single digits with every
-- section the brief mentions as "future" — Team, History, Standards,
-- Closing CTA), so the unique index backing section_key_key is already
-- everything a lookup here needs.

-- Initial content -----------------------------------------------------
-- Replaces the hardcoded placeholder previously in
-- app/(public)/about/page.tsx ("PLACEHOLDER" / "Full company story" /
-- "This page is a Phase 1 route shell..."), which must never reach
-- production. "hero" reuses the existing intro copy verbatim — it was
-- already reasonable, factual, general brand positioning, not rewritten
-- for its own sake. "story" is new but introduces no unsupported claim:
-- it only restates the "Presisi, Performa, Perkasa" motto already live
-- in website_settings.footer_description and the inspection claim
-- already on this same page today. No fabricated history, team,
-- certifications, or achievements are introduced. Both rows are normal
-- CMS content from here on — editable from Admin > Website > About,
-- never hardcoded again.
insert into public.about_page_sections (section_key, eyebrow, headline, body, sort_order, is_active)
values
  (
    'hero',
    'Tentang Kami',
    'Merancang ulang standar kemewahan.',
    'Perkasa Motors adalah etalase otomotif digital yang mengutamakan kurasi, presisi, dan kepercayaan. Setiap kendaraan yang tampil di Perkasa Motors telah melalui inspeksi internal sebelum ditawarkan kepada pelanggan.',
    1,
    true
  ),
  (
    'story',
    'Prinsip Kami',
    'Presisi, Performa, Perkasa.',
    E'Ketiga prinsip ini menjadi dasar setiap keputusan kami — mulai dari proses kurasi kendaraan, standar inspeksi internal, hingga cara kami berkomunikasi dengan setiap pelanggan.\n\nKami percaya kepercayaan pelanggan dibangun dari transparansi kondisi kendaraan dan komunikasi yang jelas, bukan sekadar janji.',
    2,
    true
  )
on conflict (section_key) do nothing;
