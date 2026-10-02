import Link from "next/link";
import { Check } from "lucide-react";
import type { Vehicle, VehicleMedia } from "@/lib/types";
import {
  formatIDR,
  formatMileage,
  fuelTypeLabel,
  publicStatusLabel,
  transmissionLabel,
  vehicleMediaAlt,
  vehicleTitle,
} from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
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

const STATUS_VARIANT = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "neutral",
} as const;

/**
 * Only rows that actually have a value are rendered (an empty optional
 * spec is hidden, never printed as "—"). "Kondisi" (Used/New) was dropped
 * from the public page: it is noise for a used-vehicle dealer. The field
 * itself is untouched in the schema and the admin.
 */
function specRows(v: Vehicle): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: "Tahun", value: String(v.year) },
    { label: "Kilometer", value: formatMileage(v.mileageKm) },
    { label: "Transmisi", value: transmissionLabel(v.transmission) },
    { label: "Bahan Bakar", value: fuelTypeLabel(v.fuelType) },
    { label: "Warna", value: v.exteriorColor?.trim() || undefined },
    { label: "Kapasitas Mesin", value: v.capacityCc ? `${v.capacityCc} CC` : undefined },
    { label: "Plat Nomor", value: v.plateNumber?.trim() || undefined },
  ];
  return rows.filter((r): r is { label: string; value: string } => Boolean(r.value));
}

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
  const statusVariant =
    vehicle.status in STATUS_VARIANT
      ? STATUS_VARIANT[vehicle.status as keyof typeof STATUS_VARIANT]
      : "neutral";

  // Resolved once here (not inside VehicleGallery) so the same fallback
  // — and the same objects — reach the main photo, the thumbnail strip,
  // and VehicleLightbox, which reuses this exact array rather than
  // re-fetching. See vehicleMediaAlt in lib/utils/format.ts.
  const mediaWithAlt = media.map((m) => ({ ...m, altText: vehicleMediaAlt(vehicle, m) }));

  const visibleHighlights = vehicle.highlights.slice(0, HIGHLIGHTS_VISIBLE_COUNT);
  const remainingHighlights = vehicle.highlights.slice(HIGHLIGHTS_VISIBLE_COUNT);
  const specs = specRows(vehicle);

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-10 md:px-8 lg:px-margin lg:py-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="md:col-span-1 lg:col-span-6">
          <VehicleGallery media={mediaWithAlt} />
        </div>

        {/* Content order: identity, availability, price, key specs, CTA,
         *  highlights — no long-form description block (removed, Phase
         *  2C.2). R3B's editorial treatment (open layout, hairline rows,
         *  small stock number) is applied here. The CTA sits above the
         *  highlights (which run 15–27 lines of seller copy) so it stays
         *  inside the first desktop viewport; R3B had pushed it below a
         *  full-width specs section. */}
        <article className="md:col-span-1 lg:col-span-6 lg:pt-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Badge variant={statusVariant}>{publicStatusLabel(vehicle.status)}</Badge>
            <p className="font-body text-label uppercase tracking-[0.08em] text-muted">
              {vehicle.stockNumber}
            </p>
          </div>

          <h1 className="mt-5 max-w-2xl break-words font-display text-headline-lg leading-[1.08] text-ink lg:text-display-sm">
            {title}
          </h1>

          <p className="mt-6 font-display text-[30px] font-semibold tabular-nums text-ink lg:text-[34px]">
            {formatIDR(vehicle.price)}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-8 border-t border-border/80">
            {specs.map((row) => (
              <div key={row.label} className="border-b border-border/70 py-3">
                <dt className="font-body text-[11px] uppercase tracking-[0.08em] text-muted">
                  {row.label}
                </dt>
                <dd className="mt-1 break-words font-body text-body font-medium text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

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
                href="/#kontak"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Hubungi Kami
              </Link>
            )}
          </div>

          {vehicle.highlights.length > 0 && (
            <div className="mt-8">
              <h2 className="font-body text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                Sorotan
              </h2>
              <ul className="mt-3 space-y-2 font-body text-[14px] leading-relaxed text-ink">
                {visibleHighlights.map((h, i) => (
                  <HighlightItem key={i} text={h} />
                ))}
              </ul>
              {remainingHighlights.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-body text-[13px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    Lihat {remainingHighlights.length} sorotan lainnya
                  </summary>
                  <ul className="mt-2 space-y-2 font-body text-[14px] leading-relaxed text-ink">
                    {remainingHighlights.map((h, i) => (
                      <HighlightItem key={i} text={h} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </article>
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

function HighlightItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <Check size={16} strokeWidth={2} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
      <span>{text}</span>
    </li>
  );
}
