-- Direct-to-WhatsApp lead flow — the public site no longer uses lead
-- forms; every contact CTA now opens WhatsApp with a pre-filled message.
--
-- Two message templates need a home:
--   - product / vehicle-specific -> reuses the existing
--     website_settings.whatsapp_lead_template column (migration
--     20260815020000_website_settings_whatsapp_template.sql), with its
--     meaning narrowed to {vehicle} + {company} only. {name} is dropped
--     at the application layer (lib/utils/whatsapp.ts) — there is no form
--     anymore, so no customer name is ever collected.
--   - generic (homepage final CTA, header "Hubungi Kami", contact page,
--     financing page) -> this new column. One nullable text column;
--     the application supplies the default when it is null/empty
--     (DEFAULT_GENERIC_WHATSAPP_TEMPLATE in lib/utils/whatsapp.ts), the
--     same pattern whatsapp_lead_template already uses.
--
-- Additive and nullable — no backfill, no RLS change, no destructive
-- change. Safe on the shared staging + production Supabase project. The
-- destination number is unchanged (website_settings.whatsapp, already
-- public-readable via the existing website_settings RLS policy).

alter table public.website_settings
  add column whatsapp_generic_template text null;

comment on column public.website_settings.whatsapp_generic_template is
  'Admin-editable WhatsApp message for generic (non-vehicle) contact CTAs — homepage final CTA, header "Hubungi Kami", contact page, financing page. Supports {company}. Null/empty falls back to the hardcoded default in lib/utils/whatsapp.ts.';
