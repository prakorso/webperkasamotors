import type { Vehicle, WebsiteSettings } from "@/lib/types";
import { vehicleTitle } from "@/lib/utils/format";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

/**
 * Direct-to-WhatsApp contact flow. The public site has no lead forms:
 * every contact CTA is a plain <a href> built here that opens WhatsApp
 * with a pre-filled message. The destination number and both message
 * templates are CMS-editable (website_settings.whatsapp /
 * whatsapp_lead_template / whatsapp_generic_template) — the constants
 * below are only the fallback used when a template column is null/blank.
 *
 * Pure module: only depends on other pure utils (format, phone), so it's
 * safe to import from server AND client components (the vehicle card and
 * financing calculator both use it client-side).
 */

/** Fallback vehicle-specific message. Supports {vehicle} and {company}. No {name} — there is no form. */
export const DEFAULT_PRODUCT_WHATSAPP_TEMPLATE =
  "Halo {company}, saya tertarik dengan {vehicle} yang saya lihat di website. Mohon info mengenai unit ini.";

/** Fallback generic (non-vehicle) message. Supports {company} only. */
export const DEFAULT_GENERIC_WHATSAPP_TEMPLATE =
  "Halo {company}, saya ingin mengetahui lebih lanjut mengenai unit yang tersedia.";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

/** Indonesian public label for a vehicle's category — folded into {vehicle} so the admin can tell Mobil from Motor in the incoming message. */
function categoryLabel(vehicle: Vehicle): string {
  return vehicle.vehicleType === "CAR" ? "Mobil" : "Motor";
}

/**
 * The {vehicle} substitution value — read straight from the live Vehicle
 * record, never duplicated into the CMS, so a title/year change is
 * reflected automatically. Deliberately says nothing about availability:
 * a RESERVED or SOLD unit must not produce a message implying it's still
 * for sale.
 */
export function vehicleWhatsAppLabel(vehicle: Vehicle): string {
  return `${vehicleTitle(vehicle)} ${vehicle.year} (${categoryLabel(vehicle)})`;
}

export function productWhatsAppMessage(
  vehicle: Vehicle,
  companyName: string,
  template: string | null | undefined
): string {
  return fillTemplate(template?.trim() || DEFAULT_PRODUCT_WHATSAPP_TEMPLATE, {
    company: companyName,
    vehicle: vehicleWhatsAppLabel(vehicle),
  });
}

export function genericWhatsAppMessage(
  companyName: string,
  template: string | null | undefined
): string {
  return fillTemplate(template?.trim() || DEFAULT_GENERIC_WHATSAPP_TEMPLATE, {
    company: companyName,
  });
}

/**
 * Standard WhatsApp deep link: https://wa.me/<number>?text=<encoded>.
 * `rawNumber` is whatever the admin typed (e.g. "+62 851-1130-7044");
 * normalizeIndonesianPhone reduces it to the digits-only 628… form wa.me
 * needs, or returns null when it isn't a usable Indonesian mobile number
 * — in which case this returns null and the caller falls back to the
 * /contact page rather than rendering a broken link. The message is
 * always encodeURIComponent'd, so spaces, punctuation, Indonesian
 * characters, and special characters in vehicle names are all safe.
 */
export function buildWhatsAppUrl(
  rawNumber: string | null | undefined,
  message: string
): string | null {
  if (!rawNumber) return null;
  const number = normalizeIndonesianPhone(rawNumber);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * The WhatsApp config a page passes down to anything that renders a
 * vehicle CTA (VehicleCard, VehicleDetail) — the raw CMS values, so the
 * per-vehicle URL is built at the leaf with live vehicle data.
 */
export interface VehicleWhatsAppConfig {
  /** website_settings.whatsapp — raw, as the admin typed it. */
  number: string | null;
  /** website_settings.company_name */
  companyName: string;
  /** website_settings.whatsapp_lead_template — the product template, or null for the default. */
  productTemplate: string | null;
}

/** One-call helper for a vehicle CTA's href. Returns null when no usable number is configured. */
export function vehicleWhatsAppUrl(
  vehicle: Vehicle,
  config: VehicleWhatsAppConfig
): string | null {
  return buildWhatsAppUrl(
    config.number,
    productWhatsAppMessage(vehicle, config.companyName, config.productTemplate)
  );
}

/** Pulls the vehicle-CTA config out of the site settings row — one place, so every catalogue/detail page passes the same thing down. */
export function vehicleWhatsAppConfig(settings: WebsiteSettings): VehicleWhatsAppConfig {
  return {
    number: settings.whatsapp,
    companyName: settings.companyName,
    productTemplate: settings.whatsappLeadTemplate,
  };
}

/** The generic (non-vehicle) contact CTA href, or null when no usable number is configured. */
export function genericWhatsAppUrl(settings: WebsiteSettings): string | null {
  return buildWhatsAppUrl(
    settings.whatsapp,
    genericWhatsAppMessage(settings.companyName, settings.whatsappGenericTemplate)
  );
}
