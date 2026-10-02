"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  updateTestimonialFields,
} from "@/lib/actions/testimonials";
import type { Testimonial } from "@/lib/types";

interface Draft {
  customerName: string;
  vehicleLabel: string;
  testimonial: string;
  isActive: boolean;
}

const EMPTY_DRAFT: Draft = { customerName: "", vehicleLabel: "", testimonial: "", isActive: true };

/**
 * Website > Beranda > Testimoni. Only REAL customer testimonials belong
 * here: the public homepage shows exactly the active ones and hides the
 * whole section when there are none, so there is no placeholder content.
 * Owner workflow: Tambah Testimoni > Nama Customer, Unit Dibeli, Testimoni,
 * Aktif > Simpan; order is changed with the up/down buttons. No ratings,
 * categories or SEO fields. Photos are not managed here (optional; an
 * existing photo is never removed by editing text).
 */
export function HomepageTestimonialsManager({ initialItems }: { initialItems: Testimonial[] }) {
  const [items, setItems] = useState(() => [...initialItems].sort((a, b) => a.sortOrder - b.sortOrder));
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startAdd() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
    setError(null);
  }

  function startEdit(item: Testimonial) {
    setDraft({
      customerName: item.customerName,
      vehicleLabel: item.roleLabel ?? "",
      testimonial: item.testimonial,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const fields = {
        customerName: draft.customerName,
        vehicleLabel: draft.vehicleLabel.trim() || null,
        testimonial: draft.testimonial,
        isActive: draft.isActive,
      };
      if (editingId === "new") {
        const result = await createTestimonial({
          customerName: fields.customerName,
          testimonial: fields.testimonial,
          roleLabel: fields.vehicleLabel,
          photoStoragePath: null,
          isActive: fields.isActive,
        });
        if (result.error || !result.id) return setError(result.error ?? "Gagal menyimpan.");
        const id = result.id;
        setItems((prev) => [
          ...prev,
          {
            id,
            customerName: fields.customerName.trim(),
            testimonial: fields.testimonial.trim(),
            roleLabel: fields.vehicleLabel?.trim() || null,
            photoUrl: null,
            sortOrder: (prev[prev.length - 1]?.sortOrder ?? 0) + 1,
            isActive: fields.isActive,
          },
        ]);
      } else if (editingId) {
        const result = await updateTestimonialFields(editingId, fields);
        if (result.error) return setError(result.error);
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingId
              ? {
                  ...it,
                  customerName: fields.customerName.trim(),
                  testimonial: fields.testimonial.trim(),
                  roleLabel: fields.vehicleLabel?.trim() || null,
                  isActive: fields.isActive,
                }
              : it
          )
        );
      }
      setEditingId(null);
    });
  }

  function remove(item: Testimonial) {
    if (!confirm(`Hapus testimoni dari ${item.customerName}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTestimonial(item.id);
      if (result.error) return setError(result.error);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    });
  }

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= items.length) return;
    const a = items[index];
    const b = items[other];
    setError(null);
    startTransition(async () => {
      const result = await reorderTestimonials([
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

  const activeCount = items.filter((it) => it.isActive).length;

  return (
    <section className="border border-border bg-surface p-6" aria-labelledby="admin-testimonials-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="admin-testimonials-heading" className="font-display text-headline-sm text-ink">
            Testimoni
          </h2>
          <p className="mt-1 max-w-xl font-body text-[13px] text-muted">
            Hanya testimoni asli dari customer. Bagian ini tampil di beranda hanya jika ada testimoni yang aktif
            ({activeCount} aktif saat ini).
          </p>
        </div>
        {editingId === null && (
          <Button type="button" onClick={startAdd} size="sm">
            <Plus size={14} aria-hidden="true" /> Tambah Testimoni
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 font-body text-[13px] text-primary">
          {error}
        </p>
      )}

      {editingId !== null && (
        <div className="mt-5 grid grid-cols-1 gap-4 border border-border bg-paper p-4 md:grid-cols-2">
          <div>
            <Label htmlFor="testi-name">Nama Customer</Label>
            <Input id="testi-name" value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="testi-unit">Unit Dibeli</Label>
            <Input
              id="testi-unit"
              value={draft.vehicleLabel}
              onChange={(e) => setDraft({ ...draft, vehicleLabel: e.target.value })}
              placeholder="Hyundai Grand Avega 2012"
              maxLength={80}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="testi-quote">Testimoni</Label>
            <Textarea id="testi-quote" rows={3} value={draft.testimonial} onChange={(e) => setDraft({ ...draft, testimonial: e.target.value })} maxLength={500} />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="testi-active"
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor="testi-active" className="mb-0">
              Aktif (tampil di beranda)
            </Label>
          </div>
          <div className="flex gap-3 md:col-span-2">
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-5 border-t border-border pt-4 font-body text-[13px] text-muted">
          Belum ada testimoni, jadi bagian ini tidak tampil di beranda.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {items.map((item, index) => (
            <li key={item.id} className="flex flex-wrap items-start gap-3 py-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={pending || index === 0}
                  aria-label={`Naikkan urutan testimoni ${item.customerName}`}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={pending || index === items.length - 1}
                  aria-label={`Turunkan urutan testimoni ${item.customerName}`}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-semibold text-ink">
                  {item.customerName}
                  {item.roleLabel && <span className="font-normal text-muted"> · {item.roleLabel}</span>}
                </p>
                <p className="mt-1 line-clamp-2 font-body text-[13px] text-muted">{item.testimonial}</p>
              </div>
              <Badge variant={item.isActive ? "success" : "neutral"}>{item.isActive ? "Aktif" : "Tidak aktif"}</Badge>
              <div className="flex gap-3 font-body text-[13px] font-medium">
                <button type="button" onClick={() => startEdit(item)} disabled={pending} className="text-primary hover:text-ink">
                  Edit
                </button>
                <button type="button" onClick={() => remove(item)} disabled={pending} className="text-muted hover:text-primary">
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
