"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateHomepageAbout } from "@/lib/actions/homepage-about";
import type { HomepageAboutAdminState } from "@/lib/types";

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Website > Beranda > Tentang Perkasa Motors. Minimal on purpose: a label,
 * a title, a short description and three short points. Anything left empty
 * uses the site's default copy (shown as the placeholder). Until the
 * homepage_about_* database columns exist (migration prepared, applied only
 * after Owner authorization) the form is read-only and says so, instead of
 * pretending to save.
 */
export function HomepageAboutForm({ state }: { state: HomepageAboutAdminState }) {
  const { about, schemaReady } = state;
  const [eyebrow, setEyebrow] = useState(about.eyebrow ?? "");
  const [title, setTitle] = useState(about.title ?? "");
  const [description, setDescription] = useState(about.description ?? "");
  const [points, setPoints] = useState<[string, string, string]>([
    about.points[0] ?? "",
    about.points[1] ?? "",
    about.points[2] ?? "",
  ]);
  const [isActive, setIsActive] = useState(about.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateHomepageAbout({
      eyebrow: orNull(eyebrow),
      title: orNull(title),
      description: orNull(description),
      points: [orNull(points[0]), orNull(points[1]), orNull(points[2])],
      isActive,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  function setPoint(index: 0 | 1 | 2, value: string) {
    const next: [string, string, string] = [...points];
    next[index] = value;
    setPoints(next);
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-surface p-6">
      <h2 className="font-display text-headline-sm text-ink">Tentang Perkasa Motors</h2>
      <p className="mt-1 font-body text-[13px] text-muted">
        Blok singkat di beranda. Kosongkan kolom untuk memakai teks bawaan situs.
      </p>

      {!schemaReady && (
        <p role="status" className="mt-4 border border-border bg-paper p-3 font-body text-[13px] text-muted">
          Pengaturan teks ini belum aktif di database, jadi beranda memakai teks bawaan dan formulir ini
          belum bisa disimpan.
        </p>
      )}

      <fieldset disabled={!schemaReady || saving} className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="home-about-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="home-about-active" className="mb-0">
            Tampilkan di beranda
          </Label>
        </div>
        <div>
          <Label htmlFor="home-about-eyebrow">Label kecil (opsional)</Label>
          <Input id="home-about-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="Tentang Kami" maxLength={40} />
        </div>
        <div>
          <Label htmlFor="home-about-title">Judul</Label>
          <Input id="home-about-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tentang Perkasa Motors" maxLength={80} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="home-about-description">Deskripsi singkat</Label>
          <Textarea
            id="home-about-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Perkasa Motors menjual mobil dan motor di … Tulis hanya hal yang bisa dibuktikan."
            maxLength={400}
          />
        </div>
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className={i === 2 ? "md:col-span-2" : undefined}>
            <Label htmlFor={`home-about-point-${i + 1}`}>Poin {i + 1}</Label>
            <Input
              id={`home-about-point-${i + 1}`}
              value={points[i]}
              onChange={(e) => setPoint(i, e.target.value)}
              placeholder={["Mobil dan motor dalam satu tempat", "Komunikasi langsung lewat WhatsApp", "Pembelian tunai atau melalui pembiayaan"][i]}
              maxLength={90}
            />
          </div>
        ))}
        <p className="font-body text-[12px] text-muted-2 md:col-span-2">
          Hindari kata yang tidak bisa dibuktikan, misalnya berkualitas, terjamin, terinspeksi, premium, atau
          bergaransi.
        </p>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={!schemaReady || saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
        {saved && (
          <span role="status" className="font-body text-[13px] text-ink">
            Tersimpan.
          </span>
        )}
        {error && (
          <span role="alert" className="font-body text-[13px] text-primary">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
