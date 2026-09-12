# Perkasa Motors Platform

Public website + internal admin console for Perkasa Motors — a curated
automotive showroom. Built on Next.js (App Router) with Supabase as the
backend and CMS data store.

## Stack

- **Next.js 16** (App Router), **TypeScript** (strict), **Tailwind CSS v4**
- **Supabase** — Postgres database, Row Level Security, Auth (admin
  sign-in), and Storage (vehicle photos, site assets)
- Fonts: Space Grotesk (display/headings), Inter (body/UI) via `next/font`
- Hand-authored UI primitives in `components/ui/`, styled in the shadcn
  pattern

## Architecture at a glance

- `app/(public)/` — the public site (`/`, `/cars`, `/motorcycles`,
  `/about`, `/contact`, `/financing`, `/articles`).
- `app/(admin)/admin/` — the internal admin console, behind Supabase Auth
  (`profiles` table with role-based access). Manages inventory, leads,
  articles, and every CMS-editable part of the public site (Hero, About,
  Why Perkasa, Testimonials, footer/social links, navigation, general
  site settings).
- `lib/data/` — server-only read functions each screen calls.
  `lib/actions/` — Server Actions for every write/mutation. `lib/types/`
  — the domain types shared by both.
- `components/public/`, `components/admin/`, `components/ui/` — public
  site components, admin console components, and shared primitives.

Almost everything a non-developer needs to change day to day — vehicle
listings and pricing, Hero/About/testimonial copy, the WhatsApp number
and message templates, footer social links — is CMS content stored in
Supabase and edited from `/admin`, not hardcoded in the React tree.

## Source of truth & deployment

GitHub is the authoritative source for all application code and
database migrations; Netlify builds and deploys from the `main` branch;
Supabase holds the runtime CMS/content data and is reproducible from
`supabase/migrations/`. The full policy — including how to classify a
change (code vs. CMS content vs. schema vs. deployment config) — lives
in [`docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md`](docs/SOURCE-OF-TRUTH-AND-DEPLOYMENT.md).

## Database

Schema lives in `supabase/migrations/`, applied in filename order to the
dedicated "Perkasa Motors Website" Supabase project — see
[`supabase/README.md`](supabase/README.md) for what's there and how to
link the Supabase CLI locally. (Migration filenames are chosen locally
for ordering; the timestamp Supabase records for an applied migration
can differ from the filename — that's expected, not a discrepancy to
"fix".)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase project values
npm run dev
```

Public site: <http://localhost:3000> · Admin console: <http://localhost:3000/admin>

## Environment variables

Copy `.env.example` to `.env.local` and fill in your own values from the
Supabase dashboard (Project Settings → API) — see that file for what
each variable is for and which ones are safe to expose to the client.
Never commit a file with real values; only `.env.example` (with blanks)
is tracked in Git.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build locally |
| `npm run lint` | ESLint |

Before pushing a change, run `npx tsc --noEmit`, `npm run lint`, and
`npm run build` — all three must pass.

## Design reference

Visual direction comes from the Google Stitch "Perkasa Motors Premium
Showroom" project — not reproduced screen-for-screen, but re-implemented
as componentized, responsive React. Design tokens live in `app/globals.css`.
