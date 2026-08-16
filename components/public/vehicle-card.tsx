import Link from "next/link";
import Image from "next/image";
import type { Vehicle, VehicleMedia } from "@/lib/types";
import { formatIDR, formatMileage, vehicleTitle } from "@/lib/utils/format";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";

interface VehicleCardProps {
  vehicle: Vehicle;
  primaryMedia?: VehicleMedia;
}

export function VehicleCard({ vehicle, primaryMedia }: VehicleCardProps) {
  const basePath = vehicle.vehicleType === "CAR" ? "/cars" : "/motorcycles";

  return (
    <Link
      href={`${basePath}/${vehicle.slug}`}
      className="group flex flex-col border border-border bg-surface transition-colors hover:border-ink"
    >
      {/* aspect-[4/5] (not the old 4/3): real uploads are native 4:5
       *  portrait photos (1080x1350 — confirmed against live vehicle_media,
       *  phone-camera/Instagram-style), so a 4:3 landscape frame forced
       *  object-cover to crop away a large vertical slice to fill the wider
       *  box. Matching the container to the photos' own ratio means
       *  object-cover (kept, for a visually consistent grid — see
       *  vehicle-media-manager.tsx's admin preview for where object-contain
       *  is the right call instead) needs little to no vertical crop for
       *  the common case, while still cropping predictably for whatever
       *  isn't exactly 4:5. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {primaryMedia && (
          <Image
            src={primaryMedia.url}
            alt={primaryMedia.altText}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3">
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="font-body text-label uppercase tracking-[0.1em] text-muted">
          {vehicle.year}
        </p>
        <h3 className="font-display text-headline-sm text-ink">{vehicleTitle(vehicle)}</h3>
        <dl className="grid grid-cols-2 gap-y-1 border-y border-border py-3 font-body text-[13px] text-muted">
          <div>
            <dt className="sr-only">Transmission</dt>
            <dd>{vehicle.transmission === "AUTOMATIC" ? "Automatic" : vehicle.transmission}</dd>
          </div>
          <div>
            <dt className="sr-only">Mileage</dt>
            <dd>{formatMileage(vehicle.mileageKm)}</dd>
          </div>
        </dl>
        <p className="mt-auto font-body text-body-lg font-semibold text-ink">
          {formatIDR(vehicle.price)}
        </p>
      </div>
    </Link>
  );
}
