"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

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
 * Visual shell only — used by both /admin/inventory/new and
 * /admin/inventory/[id]. Saving does not write to a database; it shows a
 * demo notice and returns to the inventory list so the flow can be
 * reviewed end to end without a backend.
 */
export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const isEdit = Boolean(vehicle);

  if (saved) {
    return (
      <div className="border border-border bg-surface p-8 text-center">
        <p className="font-body text-body-lg text-ink">
          {isEdit ? "Changes captured" : "Vehicle captured"} (demo only)
        </p>
        <p className="mx-auto mt-2 max-w-md font-body text-[13px] text-muted">
          Nothing was written to a database — Phase 1 has no Supabase
          connection yet. This confirms the form flow end to end.
        </p>
        <Button className="mt-6" onClick={() => router.push("/admin/inventory")}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className="flex flex-col gap-6"
    >
      <Fieldset title="Basic Information">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={vehicle?.brand} required />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={vehicle?.model} required />
        </div>
        <div>
          <Label htmlFor="variant">Variant</Label>
          <Input id="variant" name="variant" defaultValue={vehicle?.variant} />
        </div>
        <div>
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <select id="vehicleType" name="vehicleType" defaultValue={vehicle?.vehicleType ?? "CAR"} className={SELECT_CLASS}>
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" defaultValue={vehicle?.year} required />
        </div>
        <div>
          <Label htmlFor="stockNumber">Stock Number</Label>
          <Input id="stockNumber" name="stockNumber" defaultValue={vehicle?.stockNumber} required />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={vehicle?.location} placeholder="e.g. Jakarta Showroom" />
        </div>
      </Fieldset>

      <Fieldset title="Pricing &amp; Status">
        <div>
          <Label htmlFor="price">Price (IDR)</Label>
          <Input id="price" name="price" type="number" defaultValue={vehicle?.price} required />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={vehicle?.status ?? "DRAFT"} className={SELECT_CLASS}>
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
            name="isPublished"
            type="checkbox"
            defaultChecked={vehicle?.isPublished ?? false}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="isPublished" className="mb-0">
            Published (visible on the public site)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isFeatured"
            name="isFeatured"
            type="checkbox"
            defaultChecked={vehicle?.isFeatured}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="isFeatured" className="mb-0">
            Feature on homepage
          </Label>
        </div>
      </Fieldset>

      <Fieldset title="Specifications">
        <div>
          <Label htmlFor="mileageKm">Mileage (km)</Label>
          <Input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileageKm} />
        </div>
        <div>
          <Label htmlFor="transmission">Transmission</Label>
          <select id="transmission" name="transmission" defaultValue={vehicle?.transmission ?? "AUTOMATIC"} className={SELECT_CLASS}>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Automatic</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
        <div>
          <Label htmlFor="fuelType">Fuel Type</Label>
          <select id="fuelType" name="fuelType" defaultValue={vehicle?.fuelType ?? "PETROL"} className={SELECT_CLASS}>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>
        <div>
          <Label htmlFor="exteriorColor">Exterior Color</Label>
          <Input id="exteriorColor" name="exteriorColor" defaultValue={vehicle?.exteriorColor} />
        </div>
      </Fieldset>

      <Fieldset title="Description &amp; SEO">
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={4} defaultValue={vehicle?.description} />
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={vehicle?.seoTitle} />
        </div>
        <div>
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Input id="seoDescription" name="seoDescription" defaultValue={vehicle?.seoDescription} />
        </div>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg">
          {isEdit ? "Save Changes" : "Create Vehicle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/inventory")}
        >
          Cancel
        </Button>
        <span className="font-body text-[12px] text-muted-2">
          Demo only — not connected to a database.
        </span>
      </div>
    </form>
  );
}
