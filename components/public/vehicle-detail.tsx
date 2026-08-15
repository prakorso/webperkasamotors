import type { Vehicle, VehicleMedia, SocialContent } from "@/lib/types";
import { formatIDR, formatMileage, vehicleTitle } from "@/lib/utils/format";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";
import { VehicleGallery } from "./vehicle-gallery";
import { VehicleCard } from "./vehicle-card";
import { InquiryForm } from "./inquiry-form";
import { SocialContentStrip } from "./social-content-strip";
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
];

interface VehicleDetailProps {
  vehicle: Vehicle;
  media: VehicleMedia[];
  relatedVehicles: Array<{ vehicle: Vehicle; primaryMedia?: VehicleMedia }>;
  socialContent: SocialContent[];
}

export function VehicleDetail({
  vehicle,
  media,
  relatedVehicles,
  socialContent,
}: VehicleDetailProps) {
  const title = vehicleTitle(vehicle);

  return (
    <div className="mx-auto max-w-container px-6 py-10 md:px-8 lg:px-margin lg:py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="md:col-span-1 lg:col-span-7">
          <VehicleGallery media={media} />
        </div>

        <div className="md:col-span-1 lg:col-span-5">
          <VehicleStatusBadge status={vehicle.status} />
          <h1 className="mt-4 font-display text-headline-lg text-ink lg:text-display-sm">
            {title}
          </h1>
          <p className="mt-2 font-body text-body text-muted">{vehicle.stockNumber}</p>
          <p className="mt-6 font-display text-headline-lg text-primary">
            {formatIDR(vehicle.price)}
          </p>

          {vehicle.highlights.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {vehicle.highlights.map((h) => (
                <li
                  key={h}
                  className="border border-border bg-surface-muted px-3 py-1.5 font-body text-[12px] text-ink"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-8 divide-y divide-border border-y border-border">
            {SPEC_ROWS.map((row) => (
              <div key={row.label} className="flex justify-between py-3">
                <dt className="font-body text-[13px] uppercase tracking-[0.06em] text-muted">
                  {row.label}
                </dt>
                <dd className="font-body text-[14px] font-medium text-ink">
                  {row.value(vehicle)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-body text-body text-ink">{vehicle.description}</p>

          <div className="mt-8">
            <InquiryForm vehicleTitle={title} vehicleSlug={vehicle.slug} />
          </div>
        </div>
      </div>

      <section className="mt-16 lg:mt-24">
        <SectionHeading eyebrow="Social" title="From Instagram" />
        <SocialContentStrip items={socialContent} />
      </section>

      {relatedVehicles.length > 0 && (
        <section className="mt-16 lg:mt-24">
          <SectionHeading title="Related Vehicles" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedVehicles.map(({ vehicle: related, primaryMedia }) => (
              <VehicleCard key={related.id} vehicle={related} primaryMedia={primaryMedia} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
