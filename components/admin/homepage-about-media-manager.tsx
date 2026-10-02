"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { uploadImage, rollbackImageUpload } from "@/lib/storage/upload-image";
import { validateImageFile } from "@/lib/utils/image-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getStoragePublicUrl } from "@/lib/storage/provider";
import {
  addAboutMedia,
  deleteAboutMedia,
  reorderAboutMedia,
  updateAboutMedia,
} from "@/lib/actions/homepage-about-media";
import type { AboutMedia, AboutMediaAdminState } from "@/lib/types";

const BUCKET = "site-assets";
const PUBLIC_LIMIT = 4;

/**
 * Website > Beranda > Tentang Perkasa Motors > Foto / Bukti Perkasa.
 * Real photos only (customer handovers, transactions, showroom moments): the
 * public About shows the first 4 ACTIVE photos in this order, or copy only
 * when there are none. Owner workflow: Tambah Foto > (optional) keterangan >
 * Aktif / urutan / hapus. Files go straight from the browser to the existing
 * site-assets bucket (same path as every other uploader here). Until the
 * homepage_about_media table exists (migration prepared, applied only after
 * Owner authorization) the manager is read-only and says so.
 */
export function HomepageAboutMediaManager({ state }: { state: AboutMediaAdminState }) {
  const { schemaReady } = state;
  const [items, setItems] = useState<AboutMedia[]>(() =>
    [...state.items].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => i.isActive).length;

  function patch(id: string, change: Partial<AboutMedia>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...change } : it)));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `about-proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const { error: uploadError } = await uploadImage({ bucket: BUCKET, path, file, cacheControl: "3600" });
      if (uploadError) {
        setError(uploadError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      const result = await addAboutMedia(path, null);
      if (result.error || !result.id) {
        // Metadata save failed after a real upload: remove the orphaned file.
        await rollbackImageUpload(BUCKET, path);
        setError(result.error ?? "Gagal menyimpan foto.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      const url = getStoragePublicUrl(getSupabaseBrowserClient(), BUCKET, path);
      const id = result.id;
      setItems((prev) => [
        ...prev,
        { id, url, storagePath: path, caption: null, sortOrder: result.sortOrder ?? prev.length + 1, isActive: true },
      ]);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function saveCaption(item: AboutMedia) {
    setError(null);
    startTransition(async () => {
      const result = await updateAboutMedia(item.id, { caption: item.caption, isActive: item.isActive });
      if (result.error) setError(result.error);
    });
  }

  function toggleActive(item: AboutMedia, isActive: boolean) {
    setError(null);
    patch(item.id, { isActive });
    startTransition(async () => {
      const result = await updateAboutMedia(item.id, { caption: item.caption, isActive });
      if (result.error) {
        patch(item.id, { isActive: !isActive });
        setError(result.error);
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= items.length) return;
    const a = items[index];
    const b = items[other];
    setError(null);
    startTransition(async () => {
      const result = await reorderAboutMedia([
        { id: a.id, sortOrder: b.sortOrder },
        { id: b.id, sortOrder: a.sortOrder },
      ]);
      if (result.error) return setError(result.error);
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...b, sortOrder: a.sortOrder };
        next[other] = { ...a, sortOrder: b.sortOrder };
        return next;
      });
    });
  }

  function remove(item: AboutMedia) {
    if (!confirm("Hapus foto ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAboutMedia(item.id);
      if (result.error) return setError(result.error);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    });
  }

  return (
    <section className="border border-border bg-surface p-6" aria-labelledby="about-media-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="about-media-heading" className="font-display text-headline-sm text-ink">
            Foto / Bukti Perkasa
          </h2>
          <p className="mt-1 max-w-xl font-body text-[13px] text-muted">
            Hanya foto asli (serah terima, transaksi, momen di showroom). Di beranda tampil maksimal {PUBLIC_LIMIT} foto
            aktif sesuai urutan; jika belum ada foto, bagian Tentang hanya menampilkan teks ({activeCount} aktif saat ini).
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="about-media-file"
            onChange={handleFile}
            disabled={!schemaReady || pending}
          />
          <Button
            type="button"
            size="sm"
            disabled={!schemaReady || pending}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={14} aria-hidden="true" /> {pending ? "Memproses…" : "Tambah Foto"}
          </Button>
        </div>
      </div>

      {!schemaReady && (
        <p role="status" className="mt-4 border border-border bg-paper p-3 font-body text-[13px] text-muted">
          Pengaturan foto ini belum aktif di database, jadi beranda hanya menampilkan teks Tentang dan bagian ini belum
          bisa dipakai.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 font-body text-[13px] text-primary">
          {error}
        </p>
      )}

      {activeCount > PUBLIC_LIMIT && (
        <p className="mt-4 font-body text-[12px] text-muted-2">
          Ada {activeCount} foto aktif; hanya {PUBLIC_LIMIT} pertama (sesuai urutan) yang tampil di beranda.
        </p>
      )}

      {schemaReady && items.length === 0 ? (
        <p className="mt-5 border-t border-border pt-4 font-body text-[13px] text-muted">
          Belum ada foto. Tambahkan foto asli untuk menampilkan bukti di bagian Tentang.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {items.map((item, index) => (
            <li key={item.id} className="flex flex-wrap items-start gap-4 py-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={pending || index === 0}
                  aria-label={`Naikkan urutan foto ${index + 1}`}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={pending || index === items.length - 1}
                  aria-label={`Turunkan urutan foto ${index + 1}`}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-surface-muted">
                <Image
                  src={item.url}
                  alt={item.caption ?? `Foto ${index + 1}`}
                  fill
                  sizes="112px"
                  className={item.isActive ? "object-cover" : "object-cover opacity-45"}
                />
              </div>
              <div className="min-w-[12rem] flex-1">
                <label htmlFor={`about-media-caption-${item.id}`} className="font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Keterangan (opsional)
                </label>
                <Input
                  id={`about-media-caption-${item.id}`}
                  value={item.caption ?? ""}
                  maxLength={140}
                  onChange={(e) => patch(item.id, { caption: e.target.value })}
                  onBlur={() => saveCaption(item)}
                  placeholder="Mis. Serah terima unit"
                  className="mt-1 h-10"
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="flex items-center gap-2 font-body text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => toggleActive(item, e.target.checked)}
                    disabled={pending}
                    className="h-4 w-4 accent-primary"
                  />
                  Aktif
                </label>
                {!item.isActive && <Badge variant="neutral">Tidak aktif</Badge>}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={pending}
                  className="font-body text-[13px] font-medium text-muted hover:text-primary"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
