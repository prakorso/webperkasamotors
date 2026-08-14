-- Phase 2B — enums
--
-- Ported directly from the TypeScript unions in lib/types/*.ts, per
-- docs/PHASE-2-SUPABASE-PLAN.md section C. No value exists here that
-- doesn't already exist in application code today.

create extension if not exists pgcrypto;

-- lib/types/vehicle.ts
create type vehicle_type as enum ('CAR', 'MOTORCYCLE');
create type vehicle_status as enum ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED');
create type vehicle_condition as enum ('NEW', 'USED');
create type transmission as enum ('MANUAL', 'AUTOMATIC', 'CVT');
create type fuel_type as enum ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC');
create type vehicle_media_type as enum (
  'EXTERIOR', 'INTERIOR', 'ENGINE', 'WHEELS', 'DOCUMENT', 'VIDEO', 'WALKAROUND', 'OTHER'
);

-- lib/types/lead.ts
create type lead_source as enum ('WEBSITE', 'INSTAGRAM', 'WHATSAPP', 'WALK_IN', 'REFERRAL', 'OTHER');
create type lead_status as enum (
  'NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'SOLD', 'LOST', 'SPAM'
);

-- lib/types/social-content.ts (table is named `content`, see tables migration)
create type content_type as enum ('STOCK', 'REVIEW', 'REEL', 'FEATURE', 'NEWS', 'OTHER');
create type content_status as enum ('INBOX', 'CLASSIFIED', 'PUBLISHED', 'IGNORED');

-- profiles / admin console
create type staff_role as enum ('OWNER', 'ADMIN', 'STAFF');
