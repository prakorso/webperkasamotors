"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AssetUploadField } from "./asset-upload-field";
import {
  updateHeroSlides,
  recordSiteAsset,
  type UpdateHeroSlideInput,
  type UpdateHeroSlidesInput,
} from "@/lib/actions/site-settings";
import type { WebsiteSettings, HeroSlideSettings } from "@/lib/types";

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

interface SlideFormState {
  eyebrow: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
}

function toFormState(slide: HeroSlideSettings): SlideFormState {
  return {
    eyebrow: slide.eyebrow ?? "",
    headline: slide.headline ?? "",
    description: slide.description ?? "",
    ctaLabel: slide.ctaLabel ?? "",
    ctaUrl: slide.ctaUrl ?? "",
    isActive: slide.isActive,
  };
}

function toInput(form: SlideFormState): UpdateHeroSlideInput {
  return {
    eyebrow: orNull(form.eyebrow),
    headline: orNull(form.headline),
    description: orNull(form.description),
    ctaLabel: orNull(form.ctaLabel),
    ctaUrl: orNull(form.ctaUrl),
    isActive: form.isActive,
  };
}

/**
 * One slide's fields — image upload (AssetUploadField) saves itself
 * immediately on upload via recordSiteAsset, same as Logo/Favicon/OG
 * Image; every other field is local state saved together by the parent
 * form's single "Save Changes" button. This mirrors the original
 * single-hero form's split exactly (image saves on upload, everything
 * else saves on submit) — just repeated per slide.
 */
function SlideFieldset({
  index,
  imageField,
  currentImageUrl,
  form,
  onChange,
}: {
  index: 1 | 2 | 3;
  imageField: "hero1Image" | "hero2Image" | "hero3Image";
  currentImageUrl: string | null;
  form: SlideFormState;
  onChange: (form: SlideFormState) => void;
}) {
  function set<K extends keyof SlideFormState>(key: K, value: SlideFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <Fieldset title={`Hero Slide ${index}`}>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id={`hero-${index}-active`}
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <Label htmlFor={`hero-${index}-active`} className="mb-0">
          Active
        </Label>
      </div>

      <div className="md:col-span-2">
        <AssetUploadField
          field={imageField}
          label="Image"
          hint="Optional. A slide without an image uses the default background treatment."
          currentUrl={currentImageUrl}
          action={recordSiteAsset}
        />
      </div>

      <div>
        <Label htmlFor={`hero-${index}-eyebrow`}>Eyebrow</Label>
        <Input
          id={`hero-${index}-eyebrow`}
          value={form.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          placeholder="Optional — small label above the headline"
        />
      </div>
      <div>
        <Label htmlFor={`hero-${index}-cta-label`}>CTA Label</Label>
        <Input
          id={`hero-${index}-cta-label`}
          value={form.ctaLabel}
          onChange={(e) => set("ctaLabel", e.target.value)}
          placeholder="Lihat Stok Tersedia"
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor={`hero-${index}-headline`}>Headline</Label>
        <Textarea
          id={`hero-${index}-headline`}
          rows={3}
          value={form.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder={"Optional — one line per row\ne.g.\nPresisi.\nPerforma.\nPerkasa."}
        />
        <p className="mt-1.5 font-body text-[12px] text-muted-2">
          One line per row — each line break renders as its own line. A slide needs a headline to
          appear on the public site, even if Active is checked.
        </p>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor={`hero-${index}-description`}>Description</Label>
        <Textarea
          id={`hero-${index}-description`}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor={`hero-${index}-cta-url`}>CTA URL</Label>
        <Input
          id={`hero-${index}-cta-url`}
          value={form.ctaUrl}
          onChange={(e) => set("ctaUrl", e.target.value)}
          placeholder="/cars or https://…"
        />
        <p className="mt-1.5 font-body text-[12px] text-muted-2">
          An internal path like /cars, or a full external URL. Leave CTA Label/URL empty to use the
          default button.
        </p>
      </div>
    </Fieldset>
  );
}

/**
 * Website > Homepage > Hero — fixed 3-slide structure (Phase 4 Batch 4.2).
 * Deliberately not a repeatable/add-remove list: exactly three fixed
 * slots, matching the schema (hero_1_, hero_2_, hero_3_ prefixed columns
 * on website_settings, supabase/migrations/20260817010000_hero_3_slides.sql)
 * and the product decision that a one-person operation never needs more
 * than three hero slides.
 *
 * All three slides' text fields save together via updateHeroSlides (one
 * Server Action call, one "Save Changes" button) — each slide's image
 * saves independently and immediately on upload via recordSiteAsset,
 * exactly like Logo/Favicon/OG Image already do.
 *
 * On the public site (app/(public)/page.tsx), a slide only appears in the
 * rotation if Active is checked AND Headline is non-empty; zero usable
 * slides falls back to the original hardcoded DEFAULT_HERO — a
 * misconfiguration here can never produce a broken/empty homepage.
 */
export function HomepageHeroForm({ settings }: { settings: WebsiteSettings }) {
  const [slide1, setSlide1] = useState(() => toFormState(settings.heroSlide1));
  const [slide2, setSlide2] = useState(() => toFormState(settings.heroSlide2));
  const [slide3, setSlide3] = useState(() => toFormState(settings.heroSlide3));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function withSaveReset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setSaved(false);
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: UpdateHeroSlidesInput = {
      slide1: toInput(slide1),
      slide2: toInput(slide2),
      slide3: toInput(slide3),
    };

    const result = await updateHeroSlides(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-headline-sm text-ink">Hero Slides</h2>
        <p className="mt-1.5 font-body text-[13px] text-muted">
          Up to 3 slides, shown in order and rotating automatically every 4 seconds when more than
          one is active. If no slide is active (or none has a headline), the homepage shows its
          original default hero — it never shows a broken or empty one.
        </p>
      </div>

      <SlideFieldset
        index={1}
        imageField="hero1Image"
        currentImageUrl={settings.heroSlide1.imageUrl}
        form={slide1}
        onChange={withSaveReset(setSlide1)}
      />
      <SlideFieldset
        index={2}
        imageField="hero2Image"
        currentImageUrl={settings.heroSlide2.imageUrl}
        form={slide2}
        onChange={withSaveReset(setSlide2)}
      />
      <SlideFieldset
        index={3}
        imageField="hero3Image"
        currentImageUrl={settings.heroSlide3.imageUrl}
        form={slide3}
        onChange={withSaveReset(setSlide3)}
      />

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
