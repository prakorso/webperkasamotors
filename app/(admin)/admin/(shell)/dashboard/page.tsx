import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  getAllVehicleMediaForAdmin,
  getAllVehiclesForAdmin,
  getVehicleActivityForAdmin,
} from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";
import { adminStatusLabel, needsPublishSync } from "@/lib/utils/admin-vehicle";
import type { Vehicle } from "@/lib/types";

export const metadata: Metadata = { title: "Ringkasan" };

const STALE_DRAFT_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Wall-clock read kept outside the component body (server-rendered on every request; the page is dynamic). */
function currentTimeMs(): number {
  return Date.now();
}

function issuesFor(
  vehicle: Vehicle,
  photoCount: number,
  activity: { createdAt: string } | undefined,
  now: number
): string[] {
  const issues: string[] = [];
  const isActiveListing = vehicle.status !== "ARCHIVED";
  if (!isActiveListing) return issues;
  if (photoCount === 0) issues.push("Belum ada foto");
  if (vehicle.price <= 0) issues.push("Harga belum diisi");
  if (vehicle.condition === "USED" && vehicle.mileageKm <= 0) issues.push("Kilometer belum diisi");
  if (needsPublishSync(vehicle)) issues.push("Belum tayang di situs");
  if (
    vehicle.status === "DRAFT" &&
    activity &&
    now - new Date(activity.createdAt).getTime() > STALE_DRAFT_DAYS * DAY_MS
  ) {
    issues.push(`Draft lebih dari ${STALE_DRAFT_DAYS} hari`);
  }
  return issues;
}

/**
 * Ringkasan: what the owner needs on opening the admin - how many units
 * are Tersedia / Dipesan / Terjual, which listings are incomplete, what
 * was edited last, and the two things they do most (add a unit, look at
 * the site). Only data that really exists is shown: there is no status
 * history or lead data behind this page.
 */
export default async function AdminDashboardPage() {
  const [vehicles, media, activity] = await Promise.all([
    getAllVehiclesForAdmin(),
    getAllVehicleMediaForAdmin(),
    getVehicleActivityForAdmin(),
  ]);

  const count = (status: Vehicle["status"]) => vehicles.filter((v) => v.status === status).length;
  const photoCounts = new Map<string, number>();
  for (const m of media) photoCounts.set(m.vehicleId, (photoCounts.get(m.vehicleId) ?? 0) + 1);

  const now = currentTimeMs();
  const incomplete = vehicles
    .map((vehicle) => ({
      vehicle,
      issues: issuesFor(vehicle, photoCounts.get(vehicle.id) ?? 0, activity[vehicle.id], now),
    }))
    .filter((row) => row.issues.length > 0);

  const recent = [...vehicles]
    .filter((v) => activity[v.id])
    .sort((a, b) => activity[b.id].updatedAt.localeCompare(activity[a.id].updatedAt))
    .slice(0, 5);

  const stats = [
    { label: "Tersedia", value: count("AVAILABLE"), href: "/admin/inventory?status=tersedia" },
    { label: "Dipesan", value: count("RESERVED"), href: "/admin/inventory?status=dipesan" },
    { label: "Terjual", value: count("SOLD"), href: "/admin/inventory?status=terjual" },
  ];

  return (
    <div>
      <PageHeader
        title="Ringkasan"
        description="Ringkasan stok dan hal yang perlu dilengkapi."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/inventory/new" className={buttonVariants({ variant: "primary" })}>
              <Plus size={16} aria-hidden />
              Tambah Unit
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink size={16} aria-hidden />
              Lihat Situs
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-border bg-surface p-5 transition-colors hover:border-ink"
          >
            <p className="font-body text-[11px] uppercase tracking-[0.08em] text-muted">{stat.label}</p>
            <p className="mt-4 font-display text-headline-lg tabular-nums text-ink">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="border border-border bg-surface p-6 lg:col-span-7">
          <h2 className="font-display text-headline-sm text-ink">Perlu Dilengkapi</h2>
          {incomplete.length === 0 ? (
            <p className="mt-4 font-body text-[13px] text-muted">Semua unit sudah lengkap.</p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {incomplete.map(({ vehicle, issues }) => (
                <li
                  key={vehicle.id}
                  className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/admin/inventory/${vehicle.id}`}
                      className="font-body text-[13px] font-medium text-ink hover:text-primary"
                    >
                      {vehicleTitle(vehicle)} {vehicle.year}
                    </Link>
                    <p className="font-body text-[12px] text-muted">
                      {adminStatusLabel(vehicle.status)} · {vehicle.stockNumber}
                    </p>
                  </div>
                  <p className="font-body text-[12px] text-primary">{issues.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface p-6 lg:col-span-5">
          <h2 className="font-display text-headline-sm text-ink">Terakhir Diubah</h2>
          <ul className="mt-4 flex flex-col">
            {recent.map((vehicle) => (
              <li
                key={vehicle.id}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
              >
                <Link
                  href={`/admin/inventory/${vehicle.id}`}
                  className="font-body text-[13px] text-ink hover:text-primary"
                >
                  {vehicleTitle(vehicle)}
                </Link>
                <span className="shrink-0 font-body text-[12px] text-muted">
                  {new Date(activity[vehicle.id].updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
