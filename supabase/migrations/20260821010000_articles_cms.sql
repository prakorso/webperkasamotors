-- Batch: Articles CMS (SEO-ready editorial content)
--
-- Separate domain from `content` (Instagram/social) -- see lib/types/social-content.ts's
-- header for that distinction. Mirrors the vehicles/vehicle_url_history slug-stability
-- pattern: articles.slug is editable, but a slug that stops being used gets recorded
-- into article_slug_history so an old published URL 308-redirects instead of 404ing.
--
-- Purely additive: two new tables, one new enum, one new storage bucket. No existing
-- table, column, policy, row, or bucket is altered or dropped by this migration.

create type article_status as enum ('DRAFT', 'PUBLISHED');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image_storage_path text,
  og_image_storage_path text,
  category text,
  tags text[] not null default '{}',
  status article_status not null default 'DRAFT',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint articles_slug_key unique (slug)
);

comment on table public.articles is
  'Editorial/SEO website content ("Articles"). Distinct from public.content (Instagram/social posts) -- see lib/types/social-content.ts. Public visibility requires status = PUBLISHED.';
comment on column public.articles.cover_image_storage_path is 'Path within the article-media bucket.';
comment on column public.articles.og_image_storage_path is 'Optional -- falls back to cover_image_storage_path when absent (see lib/data/articles.ts).';

create index articles_status_idx on public.articles (status);
create index articles_published_at_idx on public.articles (published_at desc);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- article_slug_history --------------------------------------------------
create table public.article_slug_history (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (slug)
);

comment on table public.article_slug_history is
  'Every previous slug an article has had. Populated by updateArticle when the slug changes after an article was already published -- read by /articles/[slug] to 308-redirect a stale URL to the article''s current one, mirroring vehicle_url_history.';

create index article_slug_history_article_id_idx on public.article_slug_history (article_id);

-- RLS ---------------------------------------------------------------------
alter table public.articles enable row level security;
alter table public.article_slug_history enable row level security;

create policy "public can read published articles"
  on public.articles for select
  to anon, authenticated
  using (status = 'PUBLISHED');

create policy "staff can read all articles"
  on public.articles for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert articles"
  on public.articles for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update articles"
  on public.articles for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete articles"
  on public.articles for delete
  to authenticated
  using (public.is_active_staff());

create policy "public can read article slug history"
  on public.article_slug_history for select
  to anon, authenticated
  using (true);

create policy "staff can insert article slug history"
  on public.article_slug_history for insert
  to authenticated
  with check (public.is_active_staff());

-- storage bucket ------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('article-media', 'article-media', true)
on conflict (id) do nothing;

create policy "public can read article media objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'article-media');

create policy "staff can upload article media objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'article-media' and public.is_active_staff());

create policy "staff can update article media objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'article-media' and public.is_active_staff())
  with check (bucket_id = 'article-media' and public.is_active_staff());

create policy "staff can delete article media objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'article-media' and public.is_active_staff());
