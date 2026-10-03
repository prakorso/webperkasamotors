/**
 * R1B custom dataLayer events. GTM is the only orchestration layer: this
 * module never calls gtag()/fbq() directly, it only pushes plain objects
 * to window.dataLayer. GTM tags (configured in the GTM UI, not here)
 * listen for these via Custom Event triggers and fan them out to GA4 and
 * Meta. See docs/tracking/event-taxonomy.md for the full contract.
 *
 * Every push is gated by isMeasurementHost() here, once, so no caller has
 * to repeat the host check — localhost/preview/branch-deploy pushes are
 * silently dropped.
 */
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { isMeasurementHost } from "@/lib/measurement/host";

export type CtaLocation =
  | "header"
  | "mobile_menu"
  | "hero"
  | "vehicle_card"
  | "catalogue_empty_state"
  | "payment_section"
  | "detail_inline"
  | "detail_sticky"
  | "detail_reserved"
  | "footer";

export type CtaContext = "generic" | "vehicle" | "payment";

/** Canonical page_type vocabulary — derived from the URL at click time, never a stale prop. */
export type PageType =
  | "home"
  | "catalogue_car"
  | "catalogue_motorcycle"
  | "detail_car"
  | "detail_motorcycle"
  | "privacy"
  | "article"
  | "other";

export type ListContext = "home_available" | "home_sold" | "catalogue_available" | "catalogue_sold" | "related";

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: "CAR" | "MOTORCYCLE";
  item_variant?: string;
  price: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** item_id is the stock number — the current source audit (lib/types/vehicle.ts) confirms it is unique, human-assigned, and never a plate number. */
export function vehicleGA4Item(vehicle: Vehicle): GA4Item {
  return {
    item_id: vehicle.stockNumber,
    item_name: `${vehicle.brand} ${vehicle.model}`,
    item_brand: vehicle.brand,
    item_category: vehicle.vehicleType,
    item_variant: vehicle.variant,
    price: vehicle.price,
  };
}

export interface VehicleTrackingFields {
  itemId: string;
  itemName: string;
  itemBrand: string;
  itemCategory: "CAR" | "MOTORCYCLE";
  itemVariant?: string;
  vehicleStatus: VehicleStatus;
  value: number;
}

/** Same identity as vehicleGA4Item, in the camelCase shape WhatsAppCta's `tracking` prop (and its data-wa-* attributes) use — shared by every vehicle-context WhatsApp CTA (vehicle_card, detail_inline, detail_sticky). */
export function vehicleTrackingFields(vehicle: Vehicle): VehicleTrackingFields {
  return {
    itemId: vehicle.stockNumber,
    itemName: `${vehicle.brand} ${vehicle.model}`,
    itemBrand: vehicle.brand,
    itemCategory: vehicle.vehicleType,
    itemVariant: vehicle.variant,
    vehicleStatus: vehicle.status,
    value: vehicle.price,
  };
}

function pushDataLayerEvent(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!isMeasurementHost(window.location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export interface ViewItemParams {
  vehicle: Vehicle;
}

/** Fired once per actual detail page view (AVAILABLE, RESERVED and SOLD all qualify — GA4 is used for behavioral analysis across every status). */
export function trackViewItem({ vehicle }: ViewItemParams): void {
  pushDataLayerEvent("view_item", {
    currency: vehicle.currency,
    value: vehicle.price,
    vehicle_status: vehicle.status,
    vehicle_year: vehicle.year,
    items: [vehicleGA4Item(vehicle)],
  });
}

export interface WhatsAppClickDataset {
  waLocation: string;
  waContext: string;
  waHeroSlideIndex?: string;
  waListContext?: string;
  itemId?: string;
  itemName?: string;
  itemBrand?: string;
  itemCategory?: string;
  itemVariant?: string;
  vehicleStatus?: string;
  value?: string;
}

/** Derived from the URL at click time (not a static prop) so it is always correct even though the public layout's header/footer never remount on client-side navigation. */
export function inferPageType(pathname: string): PageType {
  if (pathname === "/") return "home";
  if (pathname === "/cars" || pathname.startsWith("/cars?")) return "catalogue_car";
  if (pathname === "/motorcycles" || pathname.startsWith("/motorcycles?")) return "catalogue_motorcycle";
  if (pathname.startsWith("/cars/")) return "detail_car";
  if (pathname.startsWith("/motorcycles/")) return "detail_motorcycle";
  if (pathname === "/privacy") return "privacy";
  if (pathname.startsWith("/articles")) return "article";
  return "other";
}

const DEDUPE_WINDOW_MS = 1000;
const recentClicks = new Map<string, number>();

/** Same CTA identity + href within ~1s is treated as one accidental double tap, not two events. Does not block navigation — the anchor's own href/target still work normally. */
function isDuplicateClick(key: string): boolean {
  const now = Date.now();
  const last = recentClicks.get(key);
  recentClicks.set(key, now);
  if (recentClicks.size > 50) {
    for (const [k, t] of recentClicks) {
      if (now - t > DEDUPE_WINDOW_MS) recentClicks.delete(k);
    }
  }
  return last !== undefined && now - last < DEDUPE_WINDOW_MS;
}

/** Reads the data-wa-* dataset off the clicked anchor and pushes one whatsapp_click, deduped. `href` is only used as part of the dedupe identity, never sent as an event parameter (section 24: no destination number / full wa.me URL). */
export function trackWhatsAppClick(dataset: WhatsAppClickDataset, href: string, pathname: string): void {
  const key = `${dataset.waLocation}|${href}`;
  if (isDuplicateClick(key)) return;

  const params: Record<string, unknown> = {
    cta_location: dataset.waLocation,
    cta_context: dataset.waContext,
    page_type: inferPageType(pathname),
  };
  if (dataset.waHeroSlideIndex !== undefined) params.hero_slide_index = Number(dataset.waHeroSlideIndex);
  if (dataset.waListContext) params.list_context = dataset.waListContext;
  if (dataset.itemId) params.item_id = dataset.itemId;
  if (dataset.itemName) params.item_name = dataset.itemName;
  if (dataset.itemBrand) params.item_brand = dataset.itemBrand;
  if (dataset.itemCategory) params.item_category = dataset.itemCategory;
  if (dataset.itemVariant) params.item_variant = dataset.itemVariant;
  if (dataset.vehicleStatus) params.vehicle_status = dataset.vehicleStatus as VehicleStatus;
  if (dataset.value) {
    params.value = Number(dataset.value);
    params.currency = "IDR";
  }

  pushDataLayerEvent("whatsapp_click", params);
}
