import Link from "next/link";
import { Check } from "lucide-react";
import type { Vehicle, VehicleMedia } from "@/lib/types";
import { formatIDR, formatMileage, vehicleTitle } from "@/lib/utils/format";
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

function cleanHighlight(highlight: string): string {
  return highlight
    .trim()
    .replace(/^(spek|spesifikasi)\s*:\s*/i, "")
    .replace(/^[-–—•]+\s*/, "")
    .replace(/\s*,?\s*dll\.?$/i, "")
    .trim();
}

function presentVehicleContent(vehicle: Vehicle): {
  description: string;
  highlights: string[];
} {
  const cleanedHighlights = vehicle.highlights
    .map(cleanHighlight)
    .filter(
      (highlight) =>
        highlight.length > 0 &&
        !/^(spek|spesifikasi)\s*:?$/i.test(highlight) &&
        !/^dll\.?$/i.test(highlight)
    );
  const cmsDescription = vehicle.description.trim();
  const editorialHighlightIndex = cmsDescription
    ? -1
    : cleanedHighlights.findIndex((highlight) => highlight.length >= 72);

  return {
    description:
      cmsDescription ||
      (editorialHighlightIndex >= 0 ? cleanedHighlights[editorialHighlightIndex] : ""),
    highlights: cleanedHighlights.filter((_, index) => index !== editorialHighlightIndex),
  };
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
  const transmission =
    vehicle.transmission === "AUTOMATIC" ? "Automatic" : vehicle.transmission;
  const { description, highlights } = presentVehicleContent(vehicle);

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-10 md:px-8 lg:px-margin lg:py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="md:col-span-1 lg:col-span-6">
          <VehicleGallery media={media} />
        </div>

        <article className="md:col-span-1 lg:col-span-6 lg:pt-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <VehicleStatusBadge status={vehicle.status} />
            <p className="font-body text-label uppercase tracking-[0.08em] text-muted">
              {vehicle.stockNumber}
            </p>
          </div>

          <h1 className="mt-5 max-w-2xl font-display text-headline-lg leading-[1.08] text-ink lg:text-display-sm">
            {title}
          </h1>

          <p className="mt-4 font-body text-body text-muted">
            {vehicle.year} <span aria-hidden="true">·</span> {transmission}{" "}
            <span aria-hidden="true">·</span> {formatMileage(vehicle.mileageKm)}
          </p>

          <p className="mt-7 font-display text-[30px] font-semibold tabular-nums text-ink lg:text-[34px]">
            {formatIDR(vehicle.price)}
          </p>

          {description && (
            <section aria-labelledby="about-vehicle" className="mt-10 border-t border-border/80 pt-8">
              <h2
                id="about-vehicle"
                className="font-body text-label font-bold uppercase tracking-[0.14em] text-primary"
              >
                About
              </h2>
              <p className="mt-4 max-w-[62ch] whitespace-pre-line font-body text-body-lg leading-relaxed text-ink/85">
                {description}
              </p>
            </section>
          )}

          {highlights.length > 0 && (
            <section
              aria-labelledby="vehicle-features"
              className="mt-10 border-t border-border/80 pt-8"
            >
              <h2
                id="vehicle-features"
                className="font-display text-headline-sm text-ink"
              >
                Condition &amp; Features
              </h2>
              <ul className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex min-h-11 items-start gap-3 border-b border-border/70 py-3 font-body text-body leading-snug text-ink/85"
                  >
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </article>
      </div>

      <section
        aria-labelledby="technical-specifications"
        className="mt-12 border-t border-border/80 pt-10 lg:mt-16 lg:pt-12"
      >
        <h2
          id="technical-specifications"
          className="font-display text-headline-sm text-ink"
        >
          Technical Specifications
        </h2>
        <dl className="mt-5 grid grid-cols-2 gap-x-8 sm:grid-cols-4 lg:gap-x-12">
          {SPEC_ROWS.map((row) => (
            <div key={row.label} className="border-b border-border/70 py-3.5">
              <dt className="font-body text-[11px] uppercase tracking-[0.08em] text-muted">
                {row.label}
              </dt>
              <dd className="mt-1.5 font-body text-body font-medium text-ink">
                {row.value(vehicle)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
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
      </section>

      {relatedVehicles.length > 0 && (
        <section className="mt-16 lg:mt-24">
          <SectionHeading title="Related Vehicles" />
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
