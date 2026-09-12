"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertAboutSection, type UpsertAboutSectionInput } from "@/lib/actions/about-page";
import type { AboutPageSection } from "@/lib/types";

/** field → null converts empty strings back to NULL rather than storing "". */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const HEADLINE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 4000;

/**
 * The known About page sections, in the order they appear on /about.
 * Adding a future section (Team, History, Standards, Closing CTA, ...) is
 * one more entry here — the key becomes the row's section_key
 * (lib/actions/about-page.ts upserts by that key), no schema change or
 * new Server Action required. This deliberately stays a short, explicit
 * list rather than a generic add/remove repeater: the brief asks for a
 * clean CMS-driven About page, not a page builder.
 */
interface SectionConfig {
  key: string;
  label: string;
  placement: string;
  bodyLabel: string;
  bodyHint: string;
  bodyRows: number;
}

const SECTION_CONFIG: SectionConfig[] = [
  {
    key: "hero",
    label: "Hero / Intro",
    placement: "Appears at the very top of /about, above everything else.",
    bodyLabel: "Intro Copy",
    bodyHint: "One or two sentences introducing the company.",
    bodyRows: 4,
  },
  {
    key: "story",
    label: "Company Story",
    placement: "Appears below the intro on /about.",
    bodyLabel: "Body",
    bodyHint: "Leave a blank line between paragraphs to start a new one.",
    bodyRows: 8,
  },
];

function AboutSectionEditor({
  config,
  sortOrder,
  section,
}: {
  config: SectionConfig;
  sortOrder: number;
  section: AboutPageSection | undefined;
}) {
  const [form, setForm] = useState({
    eyebrow: section?.eyebrow ?? "",
    headline: section?.headline ?? "",
    body: section?.body ?? "",
    isActive: section?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  /** Same rules as the server (lib/actions/about-page.ts) — see that function's own comment for why both exist. */
  function validate(): string | null {
    if (form.isActive) {
      if (!form.headline.trim()) return "Headline is required while this section is Published.";
      if (!form.body.trim()) return "Body is required while this section is Published.";
    }
    if (form.headline.length > HEADLINE_MAX_LENGTH) {
      return `Headline must be ${HEADLINE_MAX_LENGTH} characters or fewer.`;
    }
    if (form.body.length > BODY_MAX_LENGTH) {
      return `Body must be ${BODY_MAX_LENGTH} characters or fewer.`;
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

    const input: UpsertAboutSectionInput = {
      sectionKey: config.key,
      eyebrow: orNull(form.eyebrow),
      headline: orNull(form.headline),
      body: orNull(form.body),
      sortOrder,
      isActive: form.isActive,
    };

    const result = await upsertAboutSection(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-headline-sm text-ink">{config.label}</h3>
          <p className="mt-1 font-body text-[13px] text-muted">{config.placement}</p>
        </div>
        <Badge variant={form.isActive ? "success" : "neutral"}>
          {form.isActive ? "Published" : "Unpublished"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id={`${config.key}-active`}
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor={`${config.key}-active`} className="mb-0">
            Published — visible on /about
          </Label>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`${config.key}-eyebrow`}>Eyebrow</Label>
          <Input
            id={`${config.key}-eyebrow`}
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="Optional — small label above the headline"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`${config.key}-headline`}>Headline</Label>
          <Textarea
            id={`${config.key}-headline`}
            rows={2}
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="Required while Published"
            maxLength={HEADLINE_MAX_LENGTH}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`${config.key}-body`}>{config.bodyLabel}</Label>
          <Textarea
            id={`${config.key}-body`}
            rows={config.bodyRows}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="Required while Published"
            maxLength={BODY_MAX_LENGTH}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">{config.bodyHint}</p>
        </div>
      </div>

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

/**
 * Website > About / Tentang Kami. Content only, one independently
 * publishable fieldset per section — matching the Hero/About/Why Perkasa
 * homepage forms' "each section saves itself" UX rather than one giant
 * shared submit. Unpublishing a section here hides it from the public
 * /about page without deleting its copy (see app/(public)/about/page.tsx).
 */
export function AboutPageForm({ sections }: { sections: AboutPageSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-body text-[13px] text-muted">
        Content for the public{" "}
        <code className="font-mono text-ink">/about</code> page (&ldquo;Tentang Kami&rdquo;). Each
        card below is one section of that page — unpublish a section to hide it without losing the
        text.
      </p>
      {SECTION_CONFIG.map((config, index) => (
        <AboutSectionEditor
          key={config.key}
          config={config}
          sortOrder={index + 1}
          section={sections.find((s) => s.sectionKey === config.key)}
        />
      ))}
    </div>
  );
}
