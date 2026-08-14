"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateFooterSettings, type UpdateFooterSettingsInput } from "@/lib/actions/footer";
import type { FooterSettings } from "@/lib/types";

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

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Contact/Social/Copyright here are the same website_settings columns the
 * General settings screen edits — this is a second, footer-focused entry
 * point onto that shared data, not a separate store. See
 * lib/data/footer.ts's updateFooterSettings for the underlying columns.
 */
export function WebsiteFooterForm({ footer }: { footer: FooterSettings }) {
  const [form, setForm] = useState({
    description: footer.description ?? "",
    phone: footer.phone ?? "",
    whatsapp: footer.whatsapp ?? "",
    email: footer.email ?? "",
    address: footer.address ?? "",
    instagramUrl: footer.instagramUrl ?? "",
    facebookUrl: footer.facebookUrl ?? "",
    tiktokUrl: footer.tiktokUrl ?? "",
    youtubeUrl: footer.youtubeUrl ?? "",
    copyrightText: footer.copyrightText,
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

    const input: UpdateFooterSettingsInput = {
      footerDescription: orNull(form.description),
      phone: orNull(form.phone),
      whatsapp: orNull(form.whatsapp),
      email: orNull(form.email),
      address: orNull(form.address),
      instagramUrl: orNull(form.instagramUrl),
      facebookUrl: orNull(form.facebookUrl),
      tiktokUrl: orNull(form.tiktokUrl),
      youtubeUrl: orNull(form.youtubeUrl),
      copyrightText: form.copyrightText.trim() || "All rights reserved.",
    };

    const result = await updateFooterSettings(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Company">
        <div className="md:col-span-2">
          <Label htmlFor="footer-description">Short Description</Label>
          <Textarea
            id="footer-description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Company name and logo come from Website → General.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="Contact">
        <div>
          <Label htmlFor="footer-phone">Phone</Label>
          <Input id="footer-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="footer-whatsapp">WhatsApp</Label>
          <Input
            id="footer-whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="footer-email">Email</Label>
          <Input
            id="footer-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="footer-address">Address</Label>
          <Input
            id="footer-address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
      </Fieldset>

      <Fieldset title="Social">
        <div>
          <Label htmlFor="footer-instagram">Instagram URL</Label>
          <Input
            id="footer-instagram"
            value={form.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="footer-facebook">Facebook URL</Label>
          <Input
            id="footer-facebook"
            value={form.facebookUrl}
            onChange={(e) => set("facebookUrl", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="footer-tiktok">TikTok URL</Label>
          <Input
            id="footer-tiktok"
            value={form.tiktokUrl}
            onChange={(e) => set("tiktokUrl", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="footer-youtube">YouTube URL</Label>
          <Input
            id="footer-youtube"
            value={form.youtubeUrl}
            onChange={(e) => set("youtubeUrl", e.target.value)}
          />
        </div>
      </Fieldset>

      <Fieldset title="Legal">
        <div className="md:col-span-2">
          <Label htmlFor="footer-copyright">Copyright Text</Label>
          <Input
            id="footer-copyright"
            value={form.copyrightText}
            onChange={(e) => set("copyrightText", e.target.value)}
            required
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Privacy Policy / Terms links are managed below, once real pages exist for them.
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
