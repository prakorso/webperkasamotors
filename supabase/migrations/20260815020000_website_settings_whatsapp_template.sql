-- Leads/WhatsApp phase — follow-up: admin-editable WhatsApp lead message
-- template. One nullable column; no default at the DB level — the
-- application (lib/actions/leads.ts's DEFAULT_WHATSAPP_TEMPLATE) is the
-- fallback whenever this is null or empty, so the default template keeps
-- working immediately after deployment regardless of this column's value.
--
-- Every other option was checked and rejected first: no existing
-- website_settings column can be repurposed without corrupting its
-- current, actively-used meaning (tagline, footer_description,
-- default_cta_label/url, copyright_text are all already spoken for).

alter table public.website_settings
  add column whatsapp_lead_template text null;

comment on column public.website_settings.whatsapp_lead_template is
  'Admin-editable WhatsApp message template for the vehicle inquiry lead form. Supports {name}, {vehicle}, {company}. Null/empty falls back to the hardcoded default in lib/actions/leads.ts.';
