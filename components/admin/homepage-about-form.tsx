"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AssetUploadField } from "./asset-upload-field";
import {
  updateAboutSection,
  recordSiteAsset,
  type UpdateAboutSectionInput,
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

const HEADLINE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 1000;

/**
 * Website > Homepage > About / Tentang Perkasa (Phase 4 Batch 4.3).
 *
 * Content only — no design controls (no image dimensions, no
 * desktop/mobile image split, no layout/font/color fields). The admin
 * uploads exactly one image; components/public/about-section.tsx handles
 * every responsive/crop/fit concern in code.
 *
 * Client-side validation here mirrors lib/actions/site-settings.ts's
 * validateAboutSection exactly, so the admin sees the same rule
 * immediately rather than waiting on a round-trip — but the Server
 * Action re-checks everything itself regardless, since a Server Action
 * is a public endpoint and must never trust the client alone.
 */
export function HomepageAboutForm({ settings }: { settings: WebsiteSettings }) {
  const [form, setForm] = useState({
    eyebrow: settings.about.eyebrow ?? "",
    headline: settings.about.headline ?? "",
    description: settings.about.description ?? "",
    ctaLabel: settings.about.ctaLabel ?? "",
    ctaUrl: settings.about.ctaUrl ?? "",
    isActive: settings.about.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  /** Same rules as the server — see that function's own comment for why both exist. */
  function validate(): string | null {
    if (form.isActive) {
      if (!form.headline.trim()) return "Headline is required while About is Active.";
      if (!form.description.trim()) return "Description is required while About is Active.";
    }
    if (form.headline.length > HEADLINE_MAX_LENGTH) {
      return `Headline must be ${HEADLINE_MAX_LENGTH} characters or fewer.`;
    }
    if (form.description.length > DESCRIPTION_MAX_LENGTH) {
      return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }
    const hasCtaLabel = Boolean(form.ctaLabel.trim());
    const hasCtaUrl = Boolean(form.ctaUrl.trim());
    if (hasCtaLabel !== hasCtaUrl) {
      return "Fill in both CTA Label and CTA URL, or leave both empty.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const input: UpdateAboutSectionInput = {
      eyebrow: orNull(form.eyebrow),
      headline: orNull(form.headline),
      description: orNull(form.description),
      ctaLabel: orNull(form.ctaLabel),
      ctaUrl: orNull(form.ctaUrl),
      isActive: form.isActive,
    };

    const result = await updateAboutSection(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-headline-sm text-ink">About / Tentang Perkasa</h2>
        <p className="mt-1.5 font-body text-[13px] text-muted">
          A single homepage section introducing the company. Upload one image — the site handles
          sizing and cropping across desktop, tablet, and mobile automatically. If inactive or
          incomplete, the section is simply left off the homepage rather than showing broken
          content.
        </p>
      </div>

      <Fieldset title="About Section">
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="about-active"
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="about-active" className="mb-0">
            Active
          </Label>
        </div>

        <div className="md:col-span-2">
          <AssetUploadField
            field="aboutImage"
            label="Image"
            hint="Optional. Without an image, the section shows as a centered text block instead of a two-column layout."
            currentUrl={settings.about.imageUrl}
            action={recordSiteAsset}
          />
        </div>

        <div>
          <Label htmlFor="about-eyebrow">Eyebrow</Label>
          <Input
            id="about-eyebrow"
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="Optional — small label above the headline"
          />
        </div>
        <div>
          <Label htmlFor="about-cta-label">CTA Label</Label>
          <Input
            id="about-cta-label"
            value={form.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            placeholder="Optional — e.g. Tentang Kami"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="about-headline">Headline</Label>
          <Textarea
            id="about-headline"
            rows={2}
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Required while Active — e.g. Merancang ulang standar kemewahan."
            maxLength={HEADLINE_MAX_LENGTH}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="about-description">Description</Label>
          <Textarea
            id="about-description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Required while Active — the company's story and positioning."
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="about-cta-url">CTA URL</Label>
          <Input
            id="about-cta-url"
            value={form.ctaUrl}
            onChange={(e) => set("ctaUrl", e.target.value)}
            placeholder="/about or https://…"
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            An internal path like /about, or a full external URL. CTA Label and CTA URL must both
            be filled, or both left empty — a button never appears without a destination.
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
