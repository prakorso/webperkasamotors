import Link from "next/link";
import Image from "next/image";
import type { Vehicle, VehicleMedia } from "@/lib/types";
import { formatIDR, formatMileage, vehicleMediaAlt, vehicleTitle } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import {
  vehicleWhatsAppUrl,
  genericVehicleWhatsAppUrl,
  type VehicleWhatsAppConfig,
} from "@/lib/utils/whatsapp";

/** Public (Indonesian) status labels for catalogue cards. The shared admin/detail `statusLabel` stays English and is untouched. */
const CARD_STATUS: Partial<Record<Vehicle["status"], { label: string; variant: "success" | "warning" | "neutral" }>> = {
  AVAILABLE: { label: "Tersedia", variant: "success" },
  RESERVED: { label: "Dipesan", variant: "warning" },
  SOLD: { label: "Terjual", variant: "neutral" },
};

interface VehicleCardProps {
  vehicle: Vehicle;
  primaryMedia?: VehicleMedia;
  /** When provided, the card shows a direct WhatsApp CTA built from live vehicle data ("Saya Tertarik" for AVAILABLE, generic "Tanya Unit Lain" for RESERVED). SOLD cards never show a WhatsApp CTA. Omit to render a link-only card. */
  whatsapp?: VehicleWhatsAppConfig;
}

/**
 * The card body (image + text) links to the vehicle detail page; the
 * WhatsApp CTA below it is a separate interactive element (a plain <a> to
 * wa.me) — the two are siblings, never nested anchors. `group` stays on
 * the outer wrapper so the image hover-zoom / border still respond across
 * the whole card.
 */
export function VehicleCard({ vehicle, primaryMedia, whatsapp }: VehicleCardProps) {
  const basePath = vehicle.vehicleType === "CAR" ? "/cars" : "/motorcycles";
  const detailHref = `${basePath}/${vehicle.slug}`;
  // AVAILABLE = acquisition state → the normal per-vehicle CTA. RESERVED
  // keeps its own contract (a generic "ask about other units" CTA, never a
  // message implying this exact unit can be bought). SOLD is purely
  // historical/social proof: it has NO WhatsApp CTA at all (Owner decision),
  // only the prominent centered "Terjual" marker and the link to its detail.
  const isAvailable = vehicle.status === "AVAILABLE";
  const isSold = vehicle.status === "SOLD";
  const cardStatus = CARD_STATUS[vehicle.status];
  const whatsappHref =
    whatsapp && !isSold
      ? isAvailable
        ? vehicleWhatsAppUrl(vehicle, whatsapp)
        : genericVehicleWhatsAppUrl(whatsapp)
      : null;

  return (
    <div
      className={
        isSold
          ? "group flex flex-col rounded-[20px] border border-border/70 bg-surface/80 transition-[border-color,background-color] duration-300 hover:border-ink/20 hover:bg-surface"
          : "group flex flex-col rounded-[20px] border border-border/80 bg-surface shadow-[0_14px_40px_rgba(17,19,21,0.06)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_24px_60px_rgba(17,19,21,0.1)]"
      }
    >
      <Link
        href={detailHref}
        className="flex flex-1 flex-col rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
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
        <div className="relative mx-2 mt-2 aspect-[4/5] overflow-hidden rounded-[16px] bg-surface-muted">
          {primaryMedia && (
            <Image
              src={primaryMedia.url}
              alt={vehicleMediaAlt(vehicle, primaryMedia)}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
              className={
                isSold
                  ? "object-cover saturate-[0.6] brightness-[0.85] transition-[filter] duration-500 ease-out group-hover:saturate-[0.75]"
                  : "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
              }
            />
          )}
          {isSold ? (
            // Centered, restrained marker (not a loud e-commerce "sold out"
            // banner): translucent dark pill, light type, soft blur.
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-paper/45 bg-ink/60 px-6 py-2.5 font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-paper shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                Terjual
              </span>
            </div>
          ) : (
            cardStatus && (
              <div className="absolute left-3 top-3">
                <Badge variant={cardStatus.variant}>{cardStatus.label}</Badge>
              </div>
            )
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <p className="font-body text-label font-semibold uppercase tracking-[0.06em] text-muted">
            {vehicle.year}
          </p>
          <h3
            className={
              isSold
                ? "font-display text-headline-sm leading-tight text-ink/80"
                : "font-display text-headline-sm leading-tight text-ink"
            }
          >
            {vehicleTitle(vehicle)}
          </h3>
          <dl className="grid grid-cols-2 gap-y-1 border-y border-border/70 py-3 font-body text-[13px] text-muted">
            <div>
              <dt className="sr-only">Transmission</dt>
              <dd>{vehicle.transmission === "AUTOMATIC" ? "Automatic" : vehicle.transmission}</dd>
            </div>
            <div>
              <dt className="sr-only">Mileage</dt>
              <dd>{formatMileage(vehicle.mileageKm)}</dd>
            </div>
          </dl>
          <p
            className={
              isSold
                ? "mt-auto font-display text-[20px] font-semibold tabular-nums text-muted"
                : "mt-auto font-display text-[22px] font-semibold tabular-nums text-ink"
            }
          >
            {formatIDR(vehicle.price)}
          </p>
        </div>
      </Link>

      {whatsappHref && (
        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <WhatsAppCta
            href={whatsappHref}
            label={isAvailable ? "Saya Tertarik" : "Tanya Unit Lain"}
            // AVAILABLE keeps the approved secondary button; RESERVED/SOLD get
            // the quieter outline/sm treatment so the generic "Tanya Unit Lain"
            // never competes with a vehicle-specific CTA.
            variant={isAvailable ? "secondary" : "outline"}
            size={isAvailable ? "md" : "sm"}
            className="w-full"
            ariaLabel={
              isAvailable
                ? `Tanya ${vehicleTitle(vehicle)} lewat WhatsApp`
                : "Tanya unit lain yang tersedia lewat WhatsApp"
            }
          />
        </div>
      )}
    </div>
  );
}
