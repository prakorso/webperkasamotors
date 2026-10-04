"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { formatIDR, vehicleTitle } from "@/lib/utils/format";
import {
  ADMIN_STATUS_VARIANT,
  UNDELETABLE_STATUSES,
  adminStatusLabel,
  isLiveOnSite,
} from "@/lib/utils/admin-vehicle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { deleteVehicle, setVehiclePrice } from "@/lib/actions/vehicles";
import { VehicleStatusActions } from "./vehicle-status-actions";

function PriceEditor({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(vehicle.price);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!value || value <= 0) {
      setError("Isi harga lebih dari 0.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await setVehiclePrice(vehicle.id, value);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-body text-[14px] font-medium tabular-nums text-ink">
          {formatIDR(vehicle.price)}
        </span>
        <button
          type="button"
          onClick={() => {
            setValue(vehicle.price);
            setEditing(true);
          }}
          className="font-body text-[12px] font-medium text-primary hover:text-ink"
          aria-label={`Ubah harga ${vehicleTitle(vehicle)}`}
        >
          Ubah
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <NumericInput
          value={value}
          onChange={setValue}
          aria-label={`Harga baru ${vehicleTitle(vehicle)}`}
          className="h-9 w-40 px-3 text-[13px]"
        />
        <Button type="button" variant="primary" size="sm" disabled={saving} onClick={save}>
          {saving ? "…" : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
          Batal
        </Button>
      </div>
      {error && <p className="font-body text-[12px] text-primary">{error}</p>}
    </div>
  );
}

function DeleteAction({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (UNDELETABLE_STATUSES.includes(vehicle.status)) {
    return (
      <span
        className="font-body text-[12px] text-muted-2"
        title="Unit yang dipesan atau terjual tidak bisa dihapus (nomor stoknya dikunci permanen)."
      >
        Hapus
      </span>
    );
  }

  async function handleDelete() {
    if (
      !confirm(
        `Hapus permanen ${vehicleTitle(vehicle)} (${vehicle.stockNumber})? Foto ikut terhapus dan tidak bisa dikembalikan. Nomor stoknya dipensiunkan permanen dan tidak akan dipakai lagi.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteVehicle(vehicle.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="font-body text-[12px] font-medium text-muted hover:text-primary disabled:opacity-50"
      >
        {deleting ? "Menghapus…" : "Hapus"}
      </button>
      {error && <span className="font-body text-[12px] text-primary">{error}</span>}
    </span>
  );
}

/**
 * The owner's day-to-day inventory list: one card-row per unit, with the
 * three frequent tasks (change status, change price, edit) directly on it.
 * Stacks on narrow screens, so there is no wide table to scroll.
 */
export function InventoryList({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="border border-border bg-surface p-8 text-center font-body text-body text-muted">
        Belum ada unit di bagian ini.
      </p>
    );
  }

  return (
    <ul className="flex flex-col border border-border bg-surface">
      {vehicles.map((vehicle) => {
        const live = isLiveOnSite(vehicle);
        return (
          <li
            key={vehicle.id}
            className="grid grid-cols-1 gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-4">
              <p className="font-body text-[14px] font-medium text-ink">{vehicleTitle(vehicle)}</p>
              <p className="mt-0.5 font-body text-[12px] text-muted">
                {vehicle.year} · {vehicle.vehicleType === "CAR" ? "Mobil" : "Motor"} · {vehicle.stockNumber}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={ADMIN_STATUS_VARIANT[vehicle.status]}>{adminStatusLabel(vehicle.status)}</Badge>
                <span className="font-body text-[11px] text-muted-2">
                  {live ? "Tayang di situs" : "Belum tayang di situs"}
                </span>
              </div>
            </div>

            <div className="md:col-span-3">
              <PriceEditor vehicle={vehicle} />
            </div>

            <div className="md:col-span-3">
              <VehicleStatusActions vehicle={vehicle} />
            </div>

            <div className="flex items-center gap-4 md:col-span-2 md:justify-end">
              <Link
                href={`/admin/inventory/${vehicle.id}`}
                className="font-body text-[13px] font-medium text-primary hover:text-ink"
              >
                Edit
              </Link>
              <DeleteAction vehicle={vehicle} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
