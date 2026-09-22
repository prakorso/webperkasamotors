import Link from "next/link";
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

  return (
    <div className="mx-auto max-w-container px-6 py-10 md:px-8 lg:px-margin lg:py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="md:col-span-1 lg:col-span-7">
          <VehicleGallery media={media} />
        </div>

        <div className="rounded-[24px] border border-border/80 bg-surface p-6 shadow-[0_16px_48px_rgba(17,19,21,0.06)] md:col-span-1 md:p-7 lg:col-span-5 lg:p-8">
          <VehicleStatusBadge status={vehicle.status} />
          <h1 className="mt-4 font-display text-headline-lg text-ink lg:text-display-sm">
            {title}
          </h1>
          <p className="mt-2 font-body text-body text-muted">{vehicle.stockNumber}</p>
          <p className="mt-6 font-display text-headline-lg font-semibold tabular-nums text-ink">
            {formatIDR(vehicle.price)}
          </p>

          {vehicle.highlights.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {vehicle.highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-[9px] border border-border bg-surface-muted px-3 py-1.5 font-body text-[12px] text-ink"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}

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

          <p className="mt-8 font-body text-body text-ink">{vehicle.description}</p>

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
