"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createVehicle, updateVehicle, archiveVehicle, type VehicleInput } from "@/lib/actions/vehicles";

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
 * Real create/edit, backed by lib/actions/vehicles.ts. Archive (visible
 * only when editing) sets status to ARCHIVED rather than deleting the
 * row — see that action's own comment for why.
 */
export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);

  const [form, setForm] = useState({
    stockNumber: vehicle?.stockNumber ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    variant: vehicle?.variant ?? "",
    vehicleType: vehicle?.vehicleType ?? "CAR",
    year: vehicle?.year ?? new Date().getFullYear(),
    location: vehicle?.location ?? "",
    condition: vehicle?.condition ?? "USED",
    price: vehicle?.price ?? 0,
    status: vehicle?.status ?? "DRAFT",
    isPublished: vehicle?.isPublished ?? false,
    isFeatured: vehicle?.isFeatured ?? false,
    mileageKm: vehicle?.mileageKm ?? 0,
    transmission: vehicle?.transmission ?? "AUTOMATIC",
    fuelType: vehicle?.fuelType ?? "PETROL",
    exteriorColor: vehicle?.exteriorColor ?? "",
    description: vehicle?.description ?? "",
    highlights: (vehicle?.highlights ?? []).join("\n"),
    seoTitle: vehicle?.seoTitle ?? "",
    seoDescription: vehicle?.seoDescription ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: VehicleInput = {
      stockNumber: form.stockNumber,
      vehicleType: form.vehicleType,
      brand: form.brand,
      model: form.model,
      variant: form.variant || null,
      year: Number(form.year),
      price: Number(form.price),
      mileageKm: Number(form.mileageKm),
      transmission: form.transmission,
      fuelType: form.fuelType,
      exteriorColor: form.exteriorColor || null,
      location: form.location || null,
      condition: form.condition,
      status: form.status,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      description: form.description,
      highlights: form.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
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
    if (!confirm(`Archive ${form.brand} ${form.model}? It will be removed from the public site and no longer editable as active stock, but can be restored by changing its status again.`)) {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Basic Information">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="variant">Variant</Label>
          <Input id="variant" value={form.variant} onChange={(e) => set("variant", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <select
            id="vehicleType"
            value={form.vehicleType}
            onChange={(e) => set("vehicleType", e.target.value as typeof form.vehicleType)}
            className={SELECT_CLASS}
          >
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={form.year}
            onChange={(e) => set("year", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="condition">Condition</Label>
          <select
            id="condition"
            value={form.condition}
            onChange={(e) => set("condition", e.target.value as typeof form.condition)}
            className={SELECT_CLASS}
          >
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
        </div>
        <div>
          <Label htmlFor="stockNumber">Stock Number</Label>
          <Input
            id="stockNumber"
            value={form.stockNumber}
            onChange={(e) => set("stockNumber", e.target.value)}
            required
          />
        </div>
        {isEdit && vehicle && (
          <div>
            <Label className="mb-2 block">Public URL</Label>
            <a
              href={`${vehicle.vehicleType === "CAR" ? "/cars" : "/motorcycles"}/${vehicle.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center truncate border border-border bg-surface-muted px-3 font-body text-body text-muted hover:text-primary"
            >
              /{vehicle.vehicleType === "CAR" ? "cars" : "motorcycles"}/{vehicle.slug}
            </a>
            <p className="mt-1.5 font-body text-[12px] text-muted-2">
              Generated automatically when created — it never changes, so existing links keep working.
            </p>
          </div>
        )}
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Jakarta Showroom"
          />
        </div>
      </Fieldset>

      <Fieldset title="Pricing &amp; Status">
        <div>
          <Label htmlFor="price">Price (IDR)</Label>
          <Input
            id="price"
            type="number"
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as typeof form.status)}
            className={SELECT_CLASS}
          >
            <option value="DRAFT">Draft</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="isPublished" className="mb-0">
            Published (visible on the public site)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isFeatured"
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="isFeatured" className="mb-0">
            Feature on homepage
          </Label>
        </div>
        <p className="font-body text-[12px] text-muted-2 md:col-span-2">
          Public visibility requires <strong>both</strong> Published <em>and</em> a status of
          Available, Reserved, or Sold — Draft and Archived are always hidden regardless of
          Published.
        </p>
      </Fieldset>

      <Fieldset title="Specifications">
        <div>
          <Label htmlFor="mileageKm">Mileage (km)</Label>
          <Input
            id="mileageKm"
            type="number"
            value={form.mileageKm}
            onChange={(e) => set("mileageKm", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="transmission">Transmission</Label>
          <select
            id="transmission"
            value={form.transmission}
            onChange={(e) => set("transmission", e.target.value as typeof form.transmission)}
            className={SELECT_CLASS}
          >
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Automatic</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
        <div>
          <Label htmlFor="fuelType">Fuel Type</Label>
          <select
            id="fuelType"
            value={form.fuelType}
            onChange={(e) => set("fuelType", e.target.value as typeof form.fuelType)}
            className={SELECT_CLASS}
          >
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>
        <div>
          <Label htmlFor="exteriorColor">Exterior Color</Label>
          <Input
            id="exteriorColor"
            value={form.exteriorColor}
            onChange={(e) => set("exteriorColor", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="highlights">Highlights</Label>
          <Textarea
            id="highlights"
            rows={3}
            value={form.highlights}
            onChange={(e) => set("highlights", e.target.value)}
            placeholder={"One per line, e.g.\n503 hp twin-turbo I6\n0–100 km/h in 3.8s"}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Short bullets shown as chips on the vehicle card and detail page — one per line.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="Description &amp; SEO">
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Input
            id="seoDescription"
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
        </div>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Vehicle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/inventory")}
        >
          Cancel
        </Button>
        {isEdit && vehicle?.status !== "ARCHIVED" && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={archiving}
            onClick={handleArchive}
          >
            {archiving ? "Archiving…" : "Archive"}
          </Button>
        )}
        {saved && <span className="font-body text-[13px] text-success">Saved.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
