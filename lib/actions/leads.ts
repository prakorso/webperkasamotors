"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getVehicleBySlug } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleTitle } from "@/lib/utils/format";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

/**
 * The public vehicle-inquiry lead form's Server Action — the only write
 * path implemented this phase (the general /contact page's ContactForm
 * stays mock/out of scope; this is specifically the vehicle-anchored
 * "Nama + Nomor WhatsApp" flow).
 *
 * Uses the anon client (getSupabaseServerClient), not a session client —
 * there is no staff session for a public visitor, and RLS's
 * "anyone can submit a lead" policy already grants anon INSERT
 * (supabase/migrations/*_rls_policies.sql); no service-role key anywhere
 * here.
 *
 * SECURITY: the vehicle relationship is never trusted from the client.
 * The form only ever sends the vehicle's slug (public, already visible
 * in the URL — no more sensitive than what's already exposed); this
 * action re-resolves the real vehicle server-side via getVehicleBySlug,
 * the exact same RLS-filtered anon read the page itself uses to render.
 * That means a tampered or stale slug pointing at a draft/unpublished/
 * nonexistent vehicle resolves to null and the submission is rejected —
 * RLS enforces "only real, currently-public vehicles" for free, without
 * any extra logic here. interested_vehicle_id is always the id from
 * that re-resolved row, never anything the client sent directly.
 *
 * WHATSAPP TEMPLATE: website_settings.whatsapp_lead_template (nullable —
 * supabase/migrations/20260815020000_website_settings_whatsapp_template.sql)
 * is the admin-editable override, set via the Website Settings "WhatsApp
 * Lead Message" section. DEFAULT_WHATSAPP_TEMPLATE is the fallback
 * whenever that column is null or blank — see resolveTemplate below —
 * so the feature keeps working immediately after deployment even before
 * anyone touches the setting.
 */

const DEFAULT_WHATSAPP_TEMPLATE =
  "Halo {company}, saya {name}.\nSaya tertarik dengan {vehicle}.\nBoleh saya mendapatkan informasi mengenai detail unit, harga, dan ketersediaannya?";

function renderTemplate(
  template: string,
  vars: { name: string; vehicle: string; company: string }
): string {
  return template
    .replaceAll("{name}", vars.name)
    .replaceAll("{vehicle}", vars.vehicle)
    .replaceAll("{company}", vars.company);
}

/** DB template → if null/blank → DEFAULT_WHATSAPP_TEMPLATE. */
function resolveTemplate(dbTemplate: string | null): string {
  return dbTemplate?.trim() || DEFAULT_WHATSAPP_TEMPLATE;
}

export interface CreateLeadInput {
  name: string;
  whatsapp: string;
  vehicleSlug: string;
  /** Honeypot — a real visitor never fills this (it's hidden from view in
   *  the form). Any value here means the submission is treated as spam
   *  and silently dropped, without erroring in a way that would help a
   *  bot learn to avoid the trap. */
  honeypot?: string;
}

export interface CreateLeadResult {
  error: string | null;
  /** Only set on success — the pre-filled wa.me link the client opens.
   *  Absent (not an error) if no WhatsApp destination is configured yet
   *  in Website Settings; the lead is still saved either way. */
  whatsappUrl?: string;
}

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  // Silent honeypot rejection — looks identical to success so a bot gets
  // no signal that it was caught.
  if (input.honeypot) {
    return { error: null };
  }

  const name = input.name.trim();
  if (!name) return { error: "Nama wajib diisi." };
  if (name.length > 100) return { error: "Nama terlalu panjang." };

  const normalizedPhone = normalizeIndonesianPhone(input.whatsapp);
  if (!normalizedPhone) {
    return { error: "Nomor WhatsApp tidak valid. Gunakan format 08xx-xxxx-xxxx." };
  }

  const vehicle = await getVehicleBySlug(input.vehicleSlug);
  if (!vehicle) return { error: "Kendaraan tidak ditemukan." };

  const settings = await getWebsiteSettings();
  const vehicleLabel = `${vehicleTitle(vehicle)} ${vehicle.year}`;
  const message = renderTemplate(resolveTemplate(settings.whatsappLeadTemplate), {
    name,
    vehicle: vehicleLabel,
    company: settings.companyName,
  });

  const supabase = getSupabaseServerClient();

  // NOTE on duplicate submissions: an earlier version of this function
  // tried to SELECT recent leads by phone+vehicle before inserting, to
  // guard against an accidental double-tap. Live-tested and removed —
  // the anon client has no SELECT policy on `leads` at all ("public
  // users cannot read other leads" is a hard requirement, correctly
  // enforced by RLS), so that query always silently returned nothing
  // and the guard never actually did anything. A real version of this
  // would need a SECURITY DEFINER function (same pattern as
  // is_active_staff()) or a DB-level constraint — a genuine design
  // decision, not something to bolt on quietly. The realistic case this
  // was meant to cover (double-tapping the button) is already handled
  // client-side: the submit button disables itself for the duration of
  // the request (components/public/inquiry-form.tsx's `disabled={submitting}`).
  const { error } = await supabase.from("leads").insert({
    customer_name: name,
    phone: normalizedPhone,
    message,
    interested_vehicle_id: vehicle.id,
    source: "WEBSITE",
  });
  if (error) return { error: "Terjadi kesalahan. Silakan coba lagi." };

  const destination = settings.whatsapp ? normalizeIndonesianPhone(settings.whatsapp) : null;
  if (!destination) {
    // Lead is saved regardless — WhatsApp just isn't configured yet.
    return { error: null };
  }

  const whatsappUrl = `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
  return { error: null, whatsappUrl };
}
