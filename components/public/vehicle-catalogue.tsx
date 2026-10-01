import type { Vehicle, VehicleMedia } from "@/lib/types";
import { genericVehicleWhatsAppUrl, type VehicleWhatsAppConfig } from "@/lib/utils/whatsapp";
import { VehicleCard } from "./vehicle-card";
import { Pagination } from "./pagination";
import { WhatsAppCta } from "./whatsapp-cta";

interface VehicleCatalogueProps {
  title: string;
  description: string;
  /** AVAILABLE + RESERVED, already paginated by lib/data/vehicles.ts:getCatalogueByType. */
  vehicles: Vehicle[];
  /** Capped SOLD set (empty on all but the last page). Shown as a secondary "Unit Terjual" section. */
  soldVehicles?: Vehicle[];
  mediaByVehicleId: Record<string, VehicleMedia | undefined>;
  page: number;
  totalPages: number;
  basePath: string;
  /** Passed straight through to each VehicleCard so its "Saya Tertarik" CTA opens WhatsApp with that vehicle's context. */
  whatsapp?: VehicleWhatsAppConfig;
}

const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Shared layout used by both /cars and /motorcycles — the two pages differ
 * only in which vehicleType they query for (see their page.tsx files).
 * "Unit Tersedia" (AVAILABLE, then RESERVED — each card labels its own
 * status) is the primary, paginated listing; "Unit Terjual" is a capped,
 * visually secondary social-proof section that never affects pagination
 * and is omitted entirely when there are no SOLD units.
 */
export function VehicleCatalogue({
  title,
  description,
  vehicles,
  soldVehicles = [],
  mediaByVehicleId,
  page,
  totalPages,
  basePath,
  whatsapp,
}: VehicleCatalogueProps) {
  const emptyWhatsappHref = whatsapp ? genericVehicleWhatsAppUrl(whatsapp) : null;

  return (
    <div className="mx-auto max-w-container px-6 py-12 md:px-8 lg:px-margin lg:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">{title}</h1>
        <p className="mt-3 font-body text-body-lg text-muted">{description}</p>
      </div>

      <section aria-labelledby="available-inventory-heading">
        <h2
          id="available-inventory-heading"
          className="mb-6 font-display text-headline-md text-ink md:mb-8 md:text-headline-lg"
        >
          Unit Tersedia
        </h2>
        {vehicles.length > 0 ? (
          <>
            <div className={GRID}>
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  primaryMedia={mediaByVehicleId[vehicle.id]}
                  whatsapp={whatsapp}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath={basePath} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-border/80 bg-surface p-6 text-center shadow-[0_12px_32px_rgba(17,19,21,0.05)] md:p-10">
            <p className="font-body text-body text-muted">Belum ada unit tersedia saat ini.</p>
            {emptyWhatsappHref && (
              <WhatsAppCta
                href={emptyWhatsappHref}
                label="Tanya via WhatsApp"
                variant="secondary"
                size="md"
                ariaLabel="Tanyakan unit yang akan datang lewat WhatsApp"
              />
            )}
          </div>
        )}
      </section>

      {soldVehicles.length > 0 && (
        <section
          aria-labelledby="sold-inventory-heading"
          className="mt-16 border-t border-border/80 pt-12 lg:mt-24 lg:pt-16"
        >
          <h2
            id="sold-inventory-heading"
            className="mb-6 font-display text-headline-md text-ink/80 md:mb-8 md:text-headline-lg"
          >
            Unit Terjual
          </h2>
          <div className={GRID}>
            {soldVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                primaryMedia={mediaByVehicleId[vehicle.id]}
                whatsapp={whatsapp}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
