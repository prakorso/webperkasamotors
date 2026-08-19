import type { Vehicle, VehicleMedia } from "@/lib/types";
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
}: VehicleCatalogueProps) {
  return (
    <div className="mx-auto max-w-container px-6 py-12 md:px-8 lg:px-margin lg:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">{title}</h1>
        <p className="mt-3 font-body text-body-lg text-muted">{description}</p>
      </div>

      {vehicles.length === 0 ? (
        <p className="border border-border bg-surface p-10 text-center font-body text-body text-muted">
          No vehicles available in this category right now.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                primaryMedia={mediaByVehicleId[vehicle.id]}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={basePath} />
        </>
      )}
    </div>
  );
}
