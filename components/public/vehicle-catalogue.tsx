import type { Vehicle, VehicleMedia } from "@/lib/types";
import type { VehicleWhatsAppConfig } from "@/lib/utils/whatsapp";
import { VehicleCard } from "./vehicle-card";
import { Pagination } from "./pagination";

interface VehicleCatalogueProps {
  title: string;
  description: string;
  vehicles: Vehicle[];
  mediaByVehicleId: Record<string, VehicleMedia | undefined>;
  page: number;
  totalPages: number;
  basePath: string;
  /** Passed straight through to each VehicleCard so its "Saya Tertarik" CTA opens WhatsApp with that vehicle's context. */
  whatsapp?: VehicleWhatsAppConfig;
  /** Gives the Cars page a dedicated, lower-priority sold archive without changing other catalogue consumers. */
  separateSoldInventory?: boolean;
}

/**
 * Shared grid used by both /cars and /motorcycles — the two pages differ
 * only in which vehicleType they query for (see their page.tsx files),
 * not in how the results are presented. Sorting (most recently updated
 * first) and pagination (10 per page) both happen server-side in
 * lib/data/vehicles.ts:getVehiclesByTypePaginated — this component only
 * renders whatever page of results it's given, plus the Pagination
 * control for moving between pages.
 */
export function VehicleCatalogue({
  title,
  description,
  vehicles,
  mediaByVehicleId,
  page,
  totalPages,
  basePath,
  whatsapp,
  separateSoldInventory = false,
}: VehicleCatalogueProps) {
  const activeVehicles = separateSoldInventory
    ? vehicles.filter((vehicle) => vehicle.status !== "SOLD")
    : vehicles;
  const soldVehicles = separateSoldInventory
    ? vehicles.filter((vehicle) => vehicle.status === "SOLD")
    : [];

  return (
    <div className="mx-auto max-w-container px-6 py-12 md:px-8 lg:px-margin lg:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">{title}</h1>
        <p className="mt-3 font-body text-body-lg text-muted">{description}</p>
      </div>

      {vehicles.length === 0 ? (
        <p className="rounded-[24px] border border-border/80 bg-surface p-6 text-center font-body text-body text-muted shadow-[0_12px_32px_rgba(17,19,21,0.05)] md:p-10">
          No vehicles available in this category right now.
        </p>
      ) : separateSoldInventory ? (
        <>
          <section aria-labelledby="available-inventory-heading">
            <div className="mb-6 flex flex-col gap-2 md:mb-8">
              <p className="font-body text-label font-bold uppercase tracking-[0.16em] text-primary">
                Available
              </p>
              <h2
                id="available-inventory-heading"
                className="font-display text-headline-md text-ink md:text-headline-lg"
              >
                Unit Tersedia
              </h2>
              <p className="max-w-2xl font-body text-body text-muted">
                Pilihan kendaraan aktif yang siap Anda lihat dan tanyakan langsung kepada tim kami.
              </p>
            </div>

            {activeVehicles.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    primaryMedia={mediaByVehicleId[vehicle.id]}
                    whatsapp={whatsapp}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[20px] border border-border/80 bg-surface p-6 font-body text-body text-muted">
                Belum ada unit yang tersedia saat ini.
              </p>
            )}
          </section>

          {soldVehicles.length > 0 && (
            <section
              aria-labelledby="sold-inventory-heading"
              className="mt-16 border-t border-border/80 pt-12 lg:mt-24 lg:pt-16"
            >
              <div className="mb-6 flex flex-col gap-2 md:mb-8">
                <p className="font-body text-label font-bold uppercase tracking-[0.16em] text-muted">
                  Sold
                </p>
                <h2
                  id="sold-inventory-heading"
                  className="font-display text-headline-md text-ink/80 md:text-headline-lg"
                >
                  Sudah Terjual
                </h2>
                <p className="max-w-2xl font-body text-body text-muted">
                  Arsip kendaraan yang telah terjual melalui Perkasa Motors.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {soldVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    primaryMedia={mediaByVehicleId[vehicle.id]}
                    soldPresentation
                  />
                ))}
              </div>
            </section>
          )}

          <Pagination page={page} totalPages={totalPages} basePath={basePath} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
