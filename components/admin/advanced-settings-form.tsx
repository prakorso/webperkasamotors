"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { AssetUploadField } from "./asset-upload-field";
import {
  updateAdvancedSettings,
  recordSiteAsset,
  type UpdateAdvancedSettingsInput,
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

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Lanjutan: logo/favicon/share image, default SEO, footer description and
 * copyright. Contact facts are NOT here (see Kontak & WhatsApp). The
 * footer shows "© {year} {company name}. {copyright text}", so the
 * copyright text must not repeat the symbol, year or company name.
 */
export function AdvancedSettingsForm({ settings }: { settings: WebsiteSettings }) {
  const [form, setForm] = useState({
    seoTitle: settings.seoTitle ?? "",
    seoDescription: settings.seoDescription ?? "",
    footerDescription: settings.footerDescription ?? "",
    copyrightText: settings.copyrightText,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const copyrightLooksDuplicated = /©|\(c\)|\b(19|20)\d{2}\b/i.test(form.copyrightText);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: UpdateAdvancedSettingsInput = {
      seoTitle: orNull(form.seoTitle),
      seoDescription: orNull(form.seoDescription),
      footerDescription: orNull(form.footerDescription),
      copyrightText: form.copyrightText.trim(),
    };

    const result = await updateAdvancedSettings(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Logo & ikon">
        <div className="md:col-span-2">
          <AssetUploadField
            field="logo"
            label="Logo"
            hint="Tampil di header situs, menu mobile, dan sidebar admin. Jika kosong, nama usaha dipakai sebagai teks."
            currentUrl={settings.logoUrl}
            action={recordSiteAsset}
          />
        </div>
        <div className="md:col-span-2">
          <AssetUploadField
            field="favicon"
            label="Favicon"
            hint="Ikon di tab browser. Jika kosong, ikon bawaan dipakai."
            currentUrl={settings.faviconUrl}
            action={recordSiteAsset}
          />
        </div>
      </Fieldset>

      <Fieldset title="Judul & deskripsi situs (SEO)">
        <div className="md:col-span-2">
          <Label htmlFor="seoTitle">Judul situs</Label>
          <Input id="seoTitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="seoDescription">Deskripsi situs</Label>
          <Textarea
            id="seoDescription"
            rows={3}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Judul dan deskripsi halaman unit dibuat otomatis dari data unit.
          </p>
        </div>
        <div className="md:col-span-2">
          <AssetUploadField
            field="ogImage"
            label="Gambar untuk dibagikan"
            hint="Dipakai saat situs dibagikan di media sosial, kecuali halaman punya gambar sendiri (unit memakai foto utamanya)."
            currentUrl={settings.seoOgImageUrl}
            action={recordSiteAsset}
          />
        </div>
      </Fieldset>

      <Fieldset title="Footer">
        <div className="md:col-span-2">
          <Label htmlFor="footerDescription">Deskripsi singkat footer</Label>
          <Textarea
            id="footerDescription"
            rows={2}
            value={form.footerDescription}
            onChange={(e) => set("footerDescription", e.target.value)}
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Tulis hanya hal yang bisa dibuktikan. Telepon, WhatsApp, alamat, dan media sosial footer diambil
            dari Kontak &amp; WhatsApp.
          </p>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="copyrightText">Teks hak cipta</Label>
          <Input
            id="copyrightText"
            value={form.copyrightText}
            onChange={(e) => set("copyrightText", e.target.value)}
            required
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Tampil sebagai &ldquo;© {new Date().getFullYear()} nama usaha. {form.copyrightText || "…"}&rdquo;.
            Jangan menulis ulang simbol ©, tahun, atau nama usaha.
          </p>
          {copyrightLooksDuplicated && (
            <p className="mt-1.5 font-body text-[12px] text-primary">
              Teks ini sudah memuat © atau tahun, sehingga footer akan menampilkannya dua kali. Cukup tulis
              &ldquo;All rights reserved.&rdquo; atau sejenisnya.
            </p>
          )}
        </div>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
        {saved && <span className="font-body text-[13px] text-success">Tersimpan.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
