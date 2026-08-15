-- Leads/WhatsApp phase — follow-up: explicit, separately-named
-- destination number for vehicle lead WhatsApp messages, distinct from
-- the general/footer `whatsapp` field. Null falls back to `whatsapp` at
-- the application layer (lib/actions/leads.ts), so the lead flow keeps
-- working immediately whether or not this is ever explicitly set —
-- General and Lead WhatsApp can share the same number by simply leaving
-- this blank.

alter table public.website_settings
  add column whatsapp_lead_number text null;

comment on column public.website_settings.whatsapp_lead_number is
  'Destination WhatsApp number for vehicle lead inquiries. Null falls back to whatsapp (the general company number).';
