"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateContactSettings, type UpdateContactSettingsInput } from "@/lib/actions/site-settings";
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

type SocialKey = "instagramUrl" | "tiktokUrl" | "linkedinUrl" | "facebookUrl" | "youtubeUrl";

const SOCIAL_CHANNELS: Array<{ key: SocialKey; label: string; placeholder: string }> = [
  { key: "instagramUrl", label: "Instagram", placeholder: "https://www.instagram.com/…" },
  { key: "tiktokUrl", label: "TikTok", placeholder: "https://www.tiktok.com/@…" },
  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/…" },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://www.facebook.com/…" },
  { key: "youtubeUrl", label: "YouTube", placeholder: "https://www.youtube.com/…" },
];

/**
 * Kontak & WhatsApp: the one place business contact facts are edited.
 * The public header button, footer, contact page, About page and every
 * WhatsApp button read these values. (The old General and Footer forms
 * wrote these same columns, so nothing is duplicated any more.)
 * Only social channels that already have a link are shown; others can be
 * added from the list, so the form never shows a row of empty channels.
 * The public footer renders only channels that have a link.
 */
export function ContactWhatsappForm({ settings }: { settings: WebsiteSettings }) {
  const [form, setForm] = useState({
    companyName: settings.companyName,
    phone: settings.phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    facebookUrl: settings.facebookUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    youtubeUrl: settings.youtubeUrl ?? "",
    linkedinUrl: settings.linkedinUrl ?? "",
    whatsappLeadTemplate: settings.whatsappLeadTemplate ?? "",
    whatsappGenericTemplate: settings.whatsappGenericTemplate ?? "",
  });
  const [addedChannels, setAddedChannels] = useState<SocialKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const visibleChannels = SOCIAL_CHANNELS.filter(
    (c) => form[c.key].trim() !== "" || addedChannels.includes(c.key)
  );
  const hiddenChannels = SOCIAL_CHANNELS.filter((c) => !visibleChannels.includes(c));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: UpdateContactSettingsInput = {
      companyName: form.companyName.trim(),
      phone: orNull(form.phone),
      whatsapp: orNull(form.whatsapp),
      email: orNull(form.email),
      address: orNull(form.address),
      instagramUrl: orNull(form.instagramUrl),
      facebookUrl: orNull(form.facebookUrl),
      tiktokUrl: orNull(form.tiktokUrl),
      youtubeUrl: orNull(form.youtubeUrl),
      linkedinUrl: orNull(form.linkedinUrl),
      whatsappLeadTemplate: orNull(form.whatsappLeadTemplate),
      whatsappGenericTemplate: orNull(form.whatsappGenericTemplate),
    };

    const result = await updateContactSettings(input);
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Kontak">
        <div className="md:col-span-2">
          <Label htmlFor="companyName">Nama usaha</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+62 8xx xxxx xxxx"
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Tujuan semua tombol WhatsApp di situs, termasuk di footer.
          </p>
        </div>
        <div>
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+62 21 xxxx xxxx"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Alamat</Label>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Tampil di footer, halaman Kontak, dan halaman Tentang. Jam buka dan aturan kunjungan belum ada
            di situs.
          </p>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="email">Email (opsional)</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </Fieldset>

      <Fieldset title="Media sosial">
        {visibleChannels.map((channel) => (
          <div key={channel.key}>
            <Label htmlFor={channel.key}>{channel.label}</Label>
            <Input
              id={channel.key}
              value={form[channel.key]}
              onChange={(e) => set(channel.key, e.target.value)}
              placeholder={channel.placeholder}
            />
          </div>
        ))}
        {visibleChannels.length === 0 && (
          <p className="font-body text-[13px] text-muted md:col-span-2">Belum ada media sosial yang ditampilkan.</p>
        )}
        {hiddenChannels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <span className="font-body text-[12px] text-muted-2">Tambah:</span>
            {hiddenChannels.map((channel) => (
              <button
                key={channel.key}
                type="button"
                onClick={() => setAddedChannels((list) => [...list, channel.key])}
                className="border border-border px-2.5 py-1 font-body text-[12px] font-medium text-muted hover:border-ink hover:text-ink"
              >
                + {channel.label}
              </button>
            ))}
          </div>
        )}
        <p className="font-body text-[12px] text-muted-2 md:col-span-2">
          Hanya kanal yang terisi yang tampil di situs. Isi hanya akun yang benar-benar aktif.
        </p>
      </Fieldset>

      <details className="border border-border bg-surface p-6">
        <summary className="cursor-pointer font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Pesan WhatsApp (opsional)
        </summary>
        <div className="mt-5 flex flex-col gap-5">
          <div>
            <Label htmlFor="whatsappLeadTemplate">Pesan untuk unit tersedia</Label>
            <Textarea
              id="whatsappLeadTemplate"
              rows={3}
              value={form.whatsappLeadTemplate}
              onChange={(e) => set("whatsappLeadTemplate", e.target.value)}
              placeholder="Halo {company}, saya tertarik dengan {vehicle} yang saya lihat di website. Mohon info mengenai unit ini."
            />
            <p className="mt-1.5 font-body text-[12px] text-muted-2">
              Terisi otomatis saat pengunjung menekan tombol di unit yang tersedia. Variabel:{" "}
              <code className="font-mono text-ink">{"{vehicle}"}</code>,{" "}
              <code className="font-mono text-ink">{"{company}"}</code>. Kosongkan untuk memakai teks bawaan.
            </p>
          </div>
          <div>
            <Label htmlFor="whatsappGenericTemplate">Pesan umum</Label>
            <Textarea
              id="whatsappGenericTemplate"
              rows={3}
              value={form.whatsappGenericTemplate}
              onChange={(e) => set("whatsappGenericTemplate", e.target.value)}
              placeholder="Halo {company}, saya ingin mengetahui lebih lanjut mengenai unit yang tersedia."
            />
            <p className="mt-1.5 font-body text-[12px] text-muted-2">
              Dipakai tombol umum (beranda, header, Kontak) dan tombol &ldquo;Tanya Unit Lain&rdquo; pada unit
              terjual/dipesan. Variabel: <code className="font-mono text-ink">{"{company}"}</code>. Kosongkan
              untuk memakai teks bawaan.
            </p>
          </div>
        </div>
      </details>

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
