"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { FuelType, Transmission, Vehicle, VehicleType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  createVehicle,
  updateVehicle,
  archiveVehicle,
  deleteVehicle,
  type VehicleInput,
} from "@/lib/actions/vehicles";
import { UNDELETABLE_STATUSES } from "@/lib/utils/admin-vehicle";

const SELECT_CLASS =
  "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-border bg-surface p-6">
      <legend className="px-2 font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </legend>
      <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/**
 * Owner-facing vehicle form (Phase 2R.5). Only business facts are asked
 * for; everything technical is handled by the server:
 *  - slug, stock number, SEO, canonical, Open Graph and image alt text are
 *    generated automatically;
 *  - status and public visibility are changed with the status buttons
 *    (Tayangkan / Dipesan / Terjual) on the unit's page, not here, and
 *    visibility is derived from status;
 *  - condition defaults to Used, location is not asked, and "feature on
 *    homepage" is gone (the homepage shows the latest Tersedia units).
 * Business facts that used to have silent defaults (price 0, mileage 0,
 * Automatic, Petrol, current year, Car) now start empty and are required,
 * so a listing can never go out with a value the owner never chose.
 *
 * The form submits only the fields it owns; description, SEO fields and
 * flags that are not part of it are omitted from the payload, so saving
 * never overwrites them (see VehicleInput).
 */
export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);

  const [form, setForm] = useState({
    vehicleType: (vehicle?.vehicleType ?? "") as VehicleType | "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    variant: vehicle?.variant ?? "",
    year: (vehicle?.year ?? null) as number | null,
    price: (vehicle?.price ?? null) as number | null,
    mileageKm: (vehicle?.mileageKm ?? null) as number | null,
    transmission: (vehicle?.transmission ?? "") as Transmission | "",
    fuelType: (vehicle?.fuelType ?? "") as FuelType | "",
    exteriorColor: vehicle?.exteriorColor ?? "",
    capacityCc: (vehicle?.capacityCc ?? null) as number | null,
    plateNumber: vehicle?.plateNumber ?? "",
    highlights: (vehicle?.highlights ?? []).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  // Engine capacity is mainly a motorcycle fact; show it for motorcycles, or
  // when a value already exists so it stays editable.
  const showCapacity = form.vehicleType === "MOTORCYCLE" || form.capacityCc !== null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.vehicleType || !form.transmission || !form.fuelType) {
      setError("Lengkapi jenis kendaraan, transmisi, dan bahan bakar.");
      return;
    }
    if (form.year === null || form.price === null || form.mileageKm === null) {
      setError("Lengkapi tahun, harga, dan kilometer.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: VehicleInput = {
      vehicleType: form.vehicleType,
      brand: form.brand,
      model: form.model,
      variant: form.variant || null,
      year: form.year,
      price: form.price,
      mileageKm: form.mileageKm,
      transmission: form.transmission,
      fuelType: form.fuelType,
      exteriorColor: form.exteriorColor || null,
      capacityCc: showCapacity ? form.capacityCc : undefined,
      plateNumber: form.plateNumber || null,
      highlights: form.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
    };

    const result =
      isEdit && vehicle ? await updateVehicle(vehicle.id, input) : await createVehicle(input);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    if (!isEdit && "id" in result && result.id) {
      router.push(`/admin/inventory/${result.id}`);
    } else {
      router.refresh();
    }
  }

  async function handleArchive() {
    if (!vehicle) return;
    if (!confirm(`Arsipkan ${form.brand} ${form.model}? Unit disembunyikan dari situs dan bisa dikembalikan ke Draft kapan saja.`)) {
      return;
    }
    setArchiving(true);
    setError(null);
    const result = await archiveVehicle(vehicle.id);
    setArchiving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/inventory");
  }

  async function handleDelete() {
    if (!vehicle) return;
    if (
      !confirm(
        `Hapus permanen ${form.brand} ${form.model} (${vehicle.stockNumber})? Foto ikut terhapus dan tidak bisa dikembalikan. Nomor stoknya bisa dipakai lagi.`
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
    router.push("/admin/inventory");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="1. Jenis kendaraan">
        <div>
          <Label htmlFor="vehicleType">Jenis</Label>
          <select
            id="vehicleType"
            value={form.vehicleType}
            onChange={(e) => set("vehicleType", e.target.value as VehicleType | "")}
            className={SELECT_CLASS}
            required
          >
            <option value="" disabled>
              Pilih jenis…
            </option>
            <option value="CAR">Mobil</option>
            <option value="MOTORCYCLE">Motor</option>
          </select>
        </div>
      </Fieldset>

      <Fieldset title="2. Informasi unit">
        <div>
          <Label htmlFor="brand">Merek</Label>
          <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="variant">Varian (opsional)</Label>
          <Input id="variant" value={form.variant} onChange={(e) => set("variant", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="year">Tahun</Label>
          <Input
            id="year"
            type="number"
            inputMode="numeric"
            value={form.year ?? ""}
            onChange={(e) => set("year", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="mis. 2018"
            required
          />
        </div>
      </Fieldset>

      <Fieldset title="3. Harga">
        <div>
          <Label htmlFor="price">Harga (Rp)</Label>
          <NumericInput
            id="price"
            value={form.price}
            onChange={(v) => set("price", v)}
            placeholder="mis. 150,000,000"
            required
          />
        </div>
      </Fieldset>

      <Fieldset title="4. Spesifikasi">
        <div>
          <Label htmlFor="mileageKm">Kilometer</Label>
          <NumericInput
            id="mileageKm"
            value={form.mileageKm}
            onChange={(v) => set("mileageKm", v)}
            placeholder="mis. 45,000"
            required
          />
        </div>
        <div>
          <Label htmlFor="transmission">Transmisi</Label>
          <select
            id="transmission"
            value={form.transmission}
            onChange={(e) => set("transmission", e.target.value as Transmission | "")}
            className={SELECT_CLASS}
            required
          >
            <option value="" disabled>
              Pilih transmisi…
            </option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Otomatis</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
        <div>
          <Label htmlFor="fuelType">Bahan bakar</Label>
          <select
            id="fuelType"
            value={form.fuelType}
            onChange={(e) => set("fuelType", e.target.value as FuelType | "")}
            className={SELECT_CLASS}
            required
          >
            <option value="" disabled>
              Pilih bahan bakar…
            </option>
            <option value="PETROL">Bensin</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ELECTRIC">Listrik</option>
          </select>
        </div>
        <div>
          <Label htmlFor="exteriorColor">Warna (opsional)</Label>
          <Input
            id="exteriorColor"
            value={form.exteriorColor}
            onChange={(e) => set("exteriorColor", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="plateNumber">Plat nomor (opsional)</Label>
          <Input
            id="plateNumber"
            value={form.plateNumber}
            onChange={(e) => set("plateNumber", e.target.value)}
            placeholder="mis. B Jakarta"
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">Ditampilkan di situs persis seperti yang diketik.</p>
        </div>
        {showCapacity && (
          <div>
            <Label htmlFor="capacityCc">Kapasitas mesin, CC (opsional)</Label>
            <NumericInput
              id="capacityCc"
              value={form.capacityCc}
              onChange={(v) => set("capacityCc", v)}
              placeholder="mis. 155"
            />
            <p className="mt-1.5 font-body text-[12px] text-muted-2">Angka saja; situs menambahkan &ldquo;CC&rdquo;.</p>
          </div>
        )}
      </Fieldset>

      <Fieldset title="5. Highlights">
        <div className="md:col-span-2">
          <Label htmlFor="highlights">Sorotan unit (opsional)</Label>
          <Textarea
            id="highlights"
            rows={4}
            value={form.highlights}
            onChange={(e) => set("highlights", e.target.value)}
            placeholder={"Satu poin per baris, mis.\nSurat lengkap\nService record di bengkel resmi"}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Fakta singkat, satu per baris. Hanya tulis hal yang benar untuk unit ini.
          </p>
        </div>
      </Fieldset>

      {isEdit && vehicle && (
        <p className="font-body text-[12px] text-muted-2">
          Nomor stok {vehicle.stockNumber} dibuat otomatis dan tidak berubah. Alamat halaman, SEO, dan teks alt foto
          dibuat otomatis.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan & Lanjut ke Foto"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/admin/inventory")}>
          Batal
        </Button>
        {isEdit && vehicle?.status !== "ARCHIVED" && (
          <Button type="button" variant="ghost" size="lg" disabled={archiving} onClick={handleArchive}>
            {archiving ? "Mengarsipkan…" : "Arsipkan"}
          </Button>
        )}
        {isEdit && vehicle && UNDELETABLE_STATUSES.includes(vehicle.status) ? (
          <span className="font-body text-[13px] text-muted-2">
            Unit {vehicle.status === "SOLD" ? "terjual" : "dipesan"} tidak bisa dihapus (nomor stok dikunci permanen).
          </span>
        ) : (
          isEdit &&
          vehicle && (
            <Button type="button" variant="ghost" size="lg" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Menghapus…" : "Hapus"}
            </Button>
          )
        )}
        {saved && <span className="font-body text-[13px] text-success">Tersimpan.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
