import Link from "next/link";
import type { Vehicle, VehicleMedia } from "@/lib/types";
import { formatIDR, formatMileage, vehicleMediaAlt, vehicleTitle } from "@/lib/utils/format";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  vehicleWhatsAppUrl,
  genericVehicleWhatsAppUrl,
  type VehicleWhatsAppConfig,
} from "@/lib/utils/whatsapp";
import { VehicleGallery } from "./vehicle-gallery";
import { VehicleCard } from "./vehicle-card";
import { WhatsAppCta } from "./whatsapp-cta";
import { SectionHeading } from "./section-heading";

/**
 * Real inventory highlights currently run 15–27 items (raw seller ad-copy
 * dumped into the field, one line per sentence — see the Phase 2C.2
 * editorial report). Until that content is rewritten by a human into the
 * curated 3–5 bullets the field is meant to hold, showing everything
 * flat would turn the page back into the long-form listing this phase
 * exists to avoid. Progressive disclosure keeps every word the seller
 * entered reachable (nothing hidden permanently, nothing rewritten) while
 * keeping the CTA in the same viewport as the highlights that lead to it.
 */
const HIGHLIGHTS_VISIBLE_COUNT = 5;

const SPEC_ROWS: Array<{ label: string; value: (v: Vehicle) => string }> = [
  { label: "Tahun", value: (v) => String(v.year) },
  { label: "Kilometer", value: (v) => formatMileage(v.mileageKm) },
  {
    label: "Transmisi",
    value: (v) => (v.transmission === "AUTOMATIC" ? "Automatic" : v.transmission),
  },
  { label: "Bahan Bakar", value: (v) => v.fuelType.charAt(0) + v.fuelType.slice(1).toLowerCase() },
  { label: "Warna Eksterior", value: (v) => v.exteriorColor ?? "—" },
  { label: "Kondisi", value: (v) => (v.condition === "USED" ? "Used" : "New") },
  { label: "Kapasitas CC", value: (v) => (v.capacityCc ? `${v.capacityCc} CC` : "—") },
  { label: "Plat Nomor", value: (v) => v.plateNumber ?? "—" },
];

interface VehicleDetailProps {
  vehicle: Vehicle;
  media: VehicleMedia[];
  relatedVehicles: Array<{ vehicle: Vehicle; primaryMedia?: VehicleMedia }>;
  whatsapp: VehicleWhatsAppConfig;
}

export function VehicleDetail({
  vehicle,
  media,
  relatedVehicles,
  whatsapp,
}: VehicleDetailProps) {
  const title = vehicleTitle(vehicle);
  // Same AVAILABLE-gated split as VehicleCard (components/public/
  // vehicle-card.tsx) — the highest-value page on the site is exactly
  // where a misleading "buy this sold unit" message would matter most.
  const isAvailable = vehicle.status === "AVAILABLE";
  const whatsappHref = isAvailable
    ? vehicleWhatsAppUrl(vehicle, whatsapp)
    : genericVehicleWhatsAppUrl(whatsapp);

  // Resolved once here (not inside VehicleGallery) so the same fallback
  // — and the same objects — reach the main photo, the thumbnail strip,
  // and VehicleLightbox, which reuses this exact array rather than
  // re-fetching. See vehicleMediaAlt in lib/utils/format.ts.
  const mediaWithAlt = media.map((m) => ({ ...m, altText: vehicleMediaAlt(vehicle, m) }));

  const visibleHighlights = vehicle.highlights.slice(0, HIGHLIGHTS_VISIBLE_COUNT);
  const remainingHighlights = vehicle.highlights.slice(HIGHLIGHTS_VISIBLE_COUNT);

  return (
    <div className="mx-auto max-w-container px-6 py-10 md:px-8 lg:px-margin lg:py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="md:col-span-1 lg:col-span-7">
          <VehicleGallery media={mediaWithAlt} />
        </div>

        {/* Content order follows the approved vehicle-page model: identity,
         *  availability, price, key specs, highlights, CTA — no
         *  long-form description block (removed, Phase 2C.2). */}
        <div className="rounded-[24px] border border-border/80 bg-surface p-6 shadow-[0_16px_48px_rgba(17,19,21,0.06)] md:col-span-1 md:p-7 lg:col-span-5 lg:p-8">
          <VehicleStatusBadge status={vehicle.status} />
          <h1 className="mt-4 font-display text-headline-lg text-ink lg:text-display-sm">
            {title}
          </h1>
          <p className="mt-2 font-body text-body text-muted">{vehicle.stockNumber}</p>
          <p className="mt-6 font-display text-headline-lg font-semibold tabular-nums text-ink">
            {formatIDR(vehicle.price)}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 rounded-[16px] border border-border/80 bg-paper p-5 sm:grid-cols-3">
            {SPEC_ROWS.map((row) => (
              <div key={row.label}>
                <dt className="font-body text-[12px] uppercase tracking-[0.06em] text-muted">
                  {row.label}
                </dt>
                <dd className="mt-1 font-body text-[14px] font-medium text-ink">
                  {row.value(vehicle)}
                </dd>
              </div>
            ))}
          </dl>

          {vehicle.highlights.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-body text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                Sorotan
              </h2>
              <ul className="mt-3 space-y-2 font-body text-[14px] leading-relaxed text-ink">
                {visibleHighlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              {remainingHighlights.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-body text-[13px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    Lihat {remainingHighlights.length} sorotan lainnya
                  </summary>
                  <ul className="mt-2 space-y-2 font-body text-[14px] leading-relaxed text-ink">
                    {remainingHighlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="mt-8">
            {whatsappHref ? (
              <WhatsAppCta
                href={whatsappHref}
                label={isAvailable ? "Saya Tertarik dengan Unit Ini" : "Tanya Unit Lain"}
                // buttonVariants defaults to whitespace-nowrap, sized for
                // short labels — at 12px+tracked-uppercase the AVAILABLE
                // label (29 characters) is wider than a 320-375px viewport
                // can hold at "lg" size (h-13, px-8), which would either
                // clip the text or push the page into horizontal scroll.
                // Overriding to wrap + auto height (twMerge resolves the
                // whitespace/height conflicts in favor of these) keeps it
                // on one line wherever there's room and lets it break to
                // two lines, still centered and fully tappable, wherever
                // there isn't. The shorter non-AVAILABLE label never needs
                // to wrap, but sharing one className keeps both states
                // visually identical in height/alignment.
                className="h-auto min-h-13 w-full whitespace-normal py-3 text-center sm:w-auto"
                ariaLabel={
                  isAvailable
                    ? `Tanya ${title} lewat WhatsApp`
                    : "Tanya unit lain yang tersedia lewat WhatsApp"
                }
              />
            ) : (
              <Link
                href="/contact"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Hubungi Kami
              </Link>
            )}
          </div>
        </div>
      </div>

      {relatedVehicles.length > 0 && (
        <section className="mt-16 lg:mt-24">
          <SectionHeading title="Unit Lainnya" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedVehicles.map(({ vehicle: related, primaryMedia }) => (
              <VehicleCard
                key={related.id}
                vehicle={related}
                primaryMedia={primaryMedia}
                whatsapp={whatsapp}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
