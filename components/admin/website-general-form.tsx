"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AssetUploadField } from "./asset-upload-field";
import {
  updateWebsiteSettings,
  uploadSiteAsset,
  type UpdateWebsiteSettingsInput,
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

export function WebsiteGeneralForm({ settings }: { settings: WebsiteSettings }) {
  const [form, setForm] = useState({
    companyName: settings.companyName,
    tagline: settings.tagline ?? "",
    phone: settings.phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    facebookUrl: settings.facebookUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    youtubeUrl: settings.youtubeUrl ?? "",
    seoTitle: settings.seoTitle ?? "",
    seoDescription: settings.seoDescription ?? "",
    defaultCtaLabel: settings.defaultCtaLabel ?? "",
    defaultCtaUrl: settings.defaultCtaUrl ?? "",
    copyrightText: settings.copyrightText,
    whatsappLeadTemplate: settings.whatsappLeadTemplate ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: UpdateWebsiteSettingsInput = {
      companyName: form.companyName.trim() || "Perkasa Motors",
      tagline: orNull(form.tagline),
      phone: orNull(form.phone),
      whatsapp: orNull(form.whatsapp),
      email: orNull(form.email),
      address: orNull(form.address),
      instagramUrl: orNull(form.instagramUrl),
      facebookUrl: orNull(form.facebookUrl),
      tiktokUrl: orNull(form.tiktokUrl),
      youtubeUrl: orNull(form.youtubeUrl),
      seoTitle: orNull(form.seoTitle),
      seoDescription: orNull(form.seoDescription),
      defaultCtaLabel: orNull(form.defaultCtaLabel),
      defaultCtaUrl: orNull(form.defaultCtaUrl),
      copyrightText: form.copyrightText.trim() || "All rights reserved.",
      whatsappLeadTemplate: orNull(form.whatsappLeadTemplate),
    };

    const result = await updateWebsiteSettings(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Brand">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Short brand line (optional)"
          />
        </div>
        <div className="md:col-span-2">
          <AssetUploadField
            field="logo"
            label="Logo"
            hint="Shown in the public header, mobile menu, and admin sidebar. Falls back to the company name as text until uploaded."
            currentUrl={settings.logoUrl}
            action={uploadSiteAsset}
          />
        </div>
        <div className="md:col-span-2">
          <AssetUploadField
            field="favicon"
            label="Favicon"
            hint="Browser tab icon. Falls back to the default site icon until uploaded."
            currentUrl={settings.faviconUrl}
            action={uploadSiteAsset}
          />
        </div>
      </Fieldset>

      <Fieldset title="Contact">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+62 21 xxxx xxxx"
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+62 8xx xxxx xxxx"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="sales@perkasamotors.com"
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
      </Fieldset>

      <Fieldset title="WhatsApp Lead Message">
        <div className="md:col-span-2">
          <Label htmlFor="whatsappLeadTemplate">Message Template</Label>
          <Textarea
            id="whatsappLeadTemplate"
            rows={4}
            value={form.whatsappLeadTemplate}
            onChange={(e) => set("whatsappLeadTemplate", e.target.value)}
            placeholder="Halo {company}, saya {name}. Saya tertarik dengan {vehicle}. Boleh saya mendapatkan informasi mengenai detail unit, harga, dan ketersediaannya?"
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Pre-fills the WhatsApp message when someone submits the inquiry form on a vehicle
            page. Available variables:{" "}
            <code className="font-mono text-ink">{"{name}"}</code>,{" "}
            <code className="font-mono text-ink">{"{vehicle}"}</code>,{" "}
            <code className="font-mono text-ink">{"{company}"}</code>. Leave empty to use the
            default template shown above as a placeholder.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="Social">
        <div>
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input
            id="instagramUrl"
            value={form.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
            placeholder="https://instagram.com/…"
          />
        </div>
        <div>
          <Label htmlFor="facebookUrl">Facebook URL</Label>
          <Input
            id="facebookUrl"
            value={form.facebookUrl}
            onChange={(e) => set("facebookUrl", e.target.value)}
            placeholder="https://facebook.com/…"
          />
        </div>
        <div>
          <Label htmlFor="tiktokUrl">TikTok URL</Label>
          <Input
            id="tiktokUrl"
            value={form.tiktokUrl}
            onChange={(e) => set("tiktokUrl", e.target.value)}
            placeholder="https://tiktok.com/@…"
          />
        </div>
        <div>
          <Label htmlFor="youtubeUrl">YouTube URL</Label>
          <Input
            id="youtubeUrl"
            value={form.youtubeUrl}
            onChange={(e) => set("youtubeUrl", e.target.value)}
            placeholder="https://youtube.com/…"
          />
        </div>
      </Fieldset>

      <Fieldset title="SEO">
        <div className="md:col-span-2">
          <Label htmlFor="seoTitle">Site Title</Label>
          <Input
            id="seoTitle"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="seoDescription">Meta Description</Label>
          <Textarea
            id="seoDescription"
            rows={3}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <AssetUploadField
            field="ogImage"
            label="Default OG Image"
            hint="Used when the site is shared on social media, unless a page sets its own."
            currentUrl={settings.seoOgImageUrl}
            action={uploadSiteAsset}
          />
        </div>
      </Fieldset>

      <Fieldset title="General">
        <div>
          <Label htmlFor="defaultCtaLabel">Default CTA Label</Label>
          <Input
            id="defaultCtaLabel"
            value={form.defaultCtaLabel}
            onChange={(e) => set("defaultCtaLabel", e.target.value)}
            placeholder="Not yet used by any page — reserved for future sections"
          />
        </div>
        <div>
          <Label htmlFor="defaultCtaUrl">Default CTA URL</Label>
          <Input
            id="defaultCtaUrl"
            value={form.defaultCtaUrl}
            onChange={(e) => set("defaultCtaUrl", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="copyrightText">Copyright Text</Label>
          <Input
            id="copyrightText"
            value={form.copyrightText}
            onChange={(e) => set("copyrightText", e.target.value)}
            required
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Renders as &ldquo;© {new Date().getFullYear()} {form.companyName || "Company"}.{" "}
            {form.copyrightText || "…"}&rdquo; in the footer.
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
