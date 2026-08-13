# Perkasa Motors Platform

Public website + internal admin console for Perkasa Motors, built on
Next.js and (from Phase 2 onward) Supabase.

**Status: Phase 1 — application foundation.** There is no database
connection yet. Every vehicle, lead, and content record on screen comes
from `lib/mock/`, routed through `lib/data/` so the UI never has to
change when Phase 2 swaps that layer for real Supabase queries.

## Stack

- Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4
- Fonts: Space Grotesk (display/headings), Inter (body/UI) via `next/font`
- Hand-authored UI primitives in `components/ui/`, styled in the shadcn
  pattern (the shadcn CLI needs an interactive terminal this environment
  didn't have — see the Phase 1 report for detail)

## Getting started

```bash
npm install
npm run dev
```

Public site: <http://localhost:3000> · Admin console: <http://localhost:3000/admin>

## Project structure

```
app/
  (public)/     — public website routes (/, /cars, /motorcycles, /about, …)
  (admin)/      — admin console routes (/admin/*)
components/
  public/       — public site components
  admin/        — admin console components
  ui/           — shared primitives (Button, Badge, Input, …)
lib/
  types/        — domain types (Vehicle, SocialContent, Lead)
  mock/         — fixture data — the ONLY place hardcoded records live
  data/         — data-access layer every screen actually imports from
  utils/        — formatting + class-name helpers
```

## Environment

Copy `.env.example` to `.env.local`. All values are currently blank —
Supabase is not connected in Phase 1. See `.env.example` for what each
variable is for.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build locally |
| `npm run lint` | ESLint |

## Design reference

Visual direction comes from the Google Stitch "Perkasa Motors Premium
Showroom" project — not reproduced screen-for-screen, but re-implemented
as componentized, responsive React. Design tokens live in `app/globals.css`.
