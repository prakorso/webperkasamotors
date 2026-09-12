# Source of Truth & Deployment Policy

Status: **authoritative.** This governs how code, CMS content, and
database schema changes flow through this project from here on. It
doesn't describe new architecture — it writes down the flow this project
has already been following (see `supabase/README.md` and recent git
history) as an explicit, checkable policy instead of tribal knowledge.

## 1. GitHub is the source of truth

The repository is authoritative for everything that isn't live CMS
content: pages/routes (`app/`), components (`components/`), Server
Actions and data access (`lib/actions/`, `lib/data/`), types
(`lib/types/`), Tailwind/design tokens (`app/globals.css`), Supabase
schema (`supabase/migrations/`), config (`next.config.ts`,
`tsconfig.json`, `eslint.config.mjs`, `package.json`), and project
documentation (this file, `README.md`, `docs/`, `supabase/README.md`).

Every change to any of the above must exist as a Git commit. If
something is live in production (Netlify or Supabase) that has no
corresponding commit in this repo, that's configuration drift — stop and
investigate it before building on top of it, don't paper over it.

## 2. Netlify's role: deploy only

Netlify receives a commit from GitHub, installs dependencies, runs the
build (`npm run build`), and publishes the result. Nothing else.

Never: hand-edit source through the Netlify dashboard, upload a manually
built artifact, deploy uncommitted local state, or ship a production-only
patch that doesn't exist in `main`. If Netlify's deployed output and
GitHub disagree, GitHub is right — the discrepancy itself is the bug to
fix.

**Known gap:** there is no `netlify.toml` in this repo today — build
command, publish directory, and Node version currently live only in the
Netlify dashboard. That's dashboard-only configuration this policy asks
us to avoid when it can be represented in the repo instead. Codifying it
needs the actual dashboard values (they're not guessable safely); ask
before adding one so it doesn't silently override or conflict with
what's already configured live.

## 3. CMS content ≠ source code

Supabase holds production content for every CMS-managed field: vehicle
inventory/pricing/descriptions, Hero slides, homepage About, About page
sections (`about_page_sections`), Why Perkasa, testimonials, Articles,
navigation, and `website_settings` (company info, contact, WhatsApp
number/templates, social URLs including LinkedIn, footer, SEO).

Flow: **Admin CMS → Supabase → public website.** A request to change one
of these values is a content change, not a code change — use the
relevant Admin screen (see each domain's `lib/data/*.ts` /
`lib/actions/*.ts` for what's actually editable) rather than touching the
component that renders it. Never hardcode a value back into a component
that already reads it from the CMS. Only fall back to a code change when
the CMS genuinely has no field for what's being asked — and even then,
the first move is usually to extend the existing table/settings row
(Part 4 below), not to hardcode.

## 4. Database changes

All schema changes live in `supabase/migrations/`, applied in filename
order (see `supabase/README.md`). Before writing one:

1. Inspect the current live schema (not just the migration files —
   confirm they match; the two should never silently diverge).
2. Confirm the requested structure doesn't already exist somewhere else
   in the schema under a different name.
3. Avoid duplicate columns/tables/policies — reuse the existing pattern
   for the closest analogous thing already in the schema (singleton
   fields on `website_settings` vs. a dedicated one-to-many table, per
   what's already there for Hero/homepage-About/Why-Perkasa vs.
   `homepage_benefits`/`testimonials`/`about_page_sections`).
4. Prefer additive, non-destructive, backward-compatible changes. Never
   drop a column/table or rewrite existing rows without explicit
   approval.
5. Don't touch an unrelated table's columns, RLS, or data.

If a migration is applied directly to the shared Supabase project (this
project has an MCP connection to it — see recent session history), the
matching `.sql` file must still be committed to `supabase/migrations/` in
the same change. Applying schema live without a corresponding file
committed to GitHub is exactly the drift Part 1 warns about.

## 5. Deployment flow

1. Inspect current branch, commit, and `git status`.
2. Create or use a dedicated feature branch off `main`.
3. Implement the change.
4. Run `npx tsc --noEmit`, `npm run lint`, `npm run build` — all must
   exit 0.
5. Runtime/DOM QA where possible.
6. Review `git diff` / `git show --stat` for scope — confirm nothing
   unrelated is included.
7. Commit with a clear message.
8. Push the branch to GitHub.
9. Review/approve.
10. Fast-forward (or merge, per whatever the change actually needs) into
    `main` — no silent rebase/squash of already-reviewed history.
11. Push `main`.
12. Netlify builds and deploys from `main` automatically.

`main` must always represent exactly the code intended for production —
nothing ahead of it in a merged branch, nothing behind it that was
deployed out-of-band.

## 6. Environment variables

Env vars are deployment configuration, not source code. Never commit a
secret, key, or credential. `.env.example` documents every variable this
app reads and what it's for (`NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) — keep that file in sync whenever a new
variable is introduced, with a real value only ever in `.env.local`
(git-ignored) or the Netlify dashboard, never in a commit.

## 7. Portability

Stick to standard Next.js/React/TypeScript/Supabase/Web APIs. Don't
reach for a Netlify-specific feature unless there's a genuine need, and
document why when one is used. The target shape is `GitHub → hosting
provider`, replaceable on the right side — not application logic built
around one host.

## 8. Classifying a request

- **Code change** (new page/component/behavior, frontend or backend
  logic) → feature branch → commit → `main` → Netlify deploy (Part 5).
- **CMS content change** (headline, About copy, a price, a WhatsApp
  template, a social URL) → use the CMS/Supabase directly (Part 3). Only
  touch source if the CMS has no field for it yet.
- **Database schema change** (new field/table/relation/index/RLS policy)
  → migration in `supabase/migrations/`, applied safely, committed to
  GitHub (Part 4) → app code changes afterward if the schema change is in
  service of one.
- **Deployment configuration** (build command, Node version, env
  config) → prefer repository-defined configuration when the platform
  supports it; if dashboard-only configuration is unavoidable, document
  it here or in the relevant PR rather than leaving it silent.

## 9. Minimalism

Perkasa Motors is a growing automotive business with limited inventory.
A new feature needs a clear business purpose, prioritized in this order:
inventory presentation, trust, WhatsApp conversion, content quality,
performance, maintainability. The CMS/backend can grow to stay scalable;
the public frontend should stay focused, premium, and simple — resist
adding something just because it's technically easy to add.

## 10. Final principle

A fresh clone of this repository should be enough to understand what the
application is, how it's built, what the database schema is and how it
got there (`supabase/migrations/`), what environment variables it needs
(`.env.example`), and how production deploys (this file). The hosting
provider is replaceable. GitHub is not. Supabase is the production data
source; Netlify is the current deployment layer — never reverse those
roles.
