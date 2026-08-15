"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AssetUploadField } from "./asset-upload-field";
import {
  updateHeroSettings,
  uploadSiteAsset,
  type UpdateHeroSettingsInput,
} from "@/lib/actions/site-settings";
import type { WebsiteSettings } from "@/lib/types";

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

/** field → null converts empty strings back to NULL rather than storing "". */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Website > Homepage > Hero. Saves independently of the rest of Website
 * Settings via updateHeroSettings — a scoped write to just the hero_*
 * columns, same website_settings row every other settings screen reads.
 *
 * Image upload reuses uploadSiteAsset(field: "heroImage", ...) — the
 * exact same action logo/favicon/OG image already use, targeting the
 * existing site-assets bucket. No new upload code, no new bucket.
 */
export function HomepageHeroForm({ settings }: { settings: WebsiteSettings }) {
  const [form, setForm] = useState({
    heroEyebrow: settings.heroEyebrow ?? "",
    heroHeadline: settings.heroHeadline ?? "",
    heroDescription: settings.heroDescription ?? "",
    heroCtaLabel: settings.heroCtaLabel ?? "",
    heroCtaUrl: settings.heroCtaUrl ?? "",
    heroIsActive: settings.heroIsActive,
  });
  const [saving, setSaving] = useState(false);
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

    const input: UpdateHeroSettingsInput = {
      heroEyebrow: orNull(form.heroEyebrow),
      heroHeadline: orNull(form.heroHeadline),
      heroDescription: orNull(form.heroDescription),
      heroCtaLabel: orNull(form.heroCtaLabel),
      heroCtaUrl: orNull(form.heroCtaUrl),
      heroIsActive: form.heroIsActive,
    };

    const result = await updateHeroSettings(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Hero">
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="heroIsActive"
            type="checkbox"
            checked={form.heroIsActive}
            onChange={(e) => set("heroIsActive", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="heroIsActive" className="mb-0">
            Active
          </Label>
        </div>
        <p className="font-body text-[12px] text-muted-2 md:col-span-2">
          When inactive, or when Headline is empty, the public homepage shows its original default
          hero instead — the homepage never shows a broken or empty hero.
        </p>

        <div className="md:col-span-2">
          <AssetUploadField
            field="heroImage"
            label="Hero Image"
            hint="Optional. Falls back to the default background treatment until uploaded."
            currentUrl={settings.heroImageUrl}
            action={uploadSiteAsset}
          />
        </div>

        <div>
          <Label htmlFor="heroEyebrow">Eyebrow</Label>
          <Input
            id="heroEyebrow"
            value={form.heroEyebrow}
            onChange={(e) => set("heroEyebrow", e.target.value)}
            placeholder="Optional — small label above the headline"
          />
        </div>
        <div>
          <Label htmlFor="heroCtaLabel">CTA Label</Label>
          <Input
            id="heroCtaLabel"
            value={form.heroCtaLabel}
            onChange={(e) => set("heroCtaLabel", e.target.value)}
            placeholder="Lihat Stok Tersedia"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="heroHeadline">Headline</Label>
          <Textarea
            id="heroHeadline"
            rows={3}
            value={form.heroHeadline}
            onChange={(e) => set("heroHeadline", e.target.value)}
            placeholder={"Presisi.\nPerforma.\nPerkasa."}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            One line per row — each line break renders as its own line in the hero, matching the
            current three-line look.
          </p>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="heroDescription">Description</Label>
          <Textarea
            id="heroDescription"
            rows={2}
            value={form.heroDescription}
            onChange={(e) => set("heroDescription", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="heroCtaUrl">CTA URL</Label>
          <Input
            id="heroCtaUrl"
            value={form.heroCtaUrl}
            onChange={(e) => set("heroCtaUrl", e.target.value)}
            placeholder="/cars or https://…"
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            An internal path like /cars, or a full external URL.
          </p>
        </div>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="font-body text-[13px] text-success">Saved.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
