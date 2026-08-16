"use client";

import { useState, type FormEvent } from "react";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { InlineImageUpload } from "./inline-image-upload";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  type TestimonialInput,
} from "@/lib/actions/testimonials";
import type { Testimonial } from "@/lib/types";

const BUCKET = "testimonials";

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const EMPTY_FORM = { customerName: "", testimonial: "", roleLabel: "", isActive: true };
type TestimonialFormState = typeof EMPTY_FORM;

function TestimonialRow({
  testimonial,
  isFirst,
  isLast,
  onMove,
  onSaved,
  onDeleted,
}: {
  testimonial: Testimonial;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onSaved: (updated: Testimonial) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TestimonialFormState>({
    customerName: testimonial.customerName,
    testimonial: testimonial.testimonial,
    roleLabel: testimonial.roleLabel ?? "",
    isActive: testimonial.isActive,
  });
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TestimonialFormState>(key: K, value: TestimonialFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input: TestimonialInput = {
      customerName: form.customerName,
      testimonial: form.testimonial,
      roleLabel: orNull(form.roleLabel),
      // photoStoragePath stays whatever it already was unless a new
      // upload happened this session — updateTestimonial always needs a
      // value, so re-send the unchanged one rather than nulling the photo.
      photoStoragePath: photoStoragePath,
      isActive: form.isActive,
    };
    const result = await updateTestimonial(testimonial.id, input);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    onSaved({
      ...testimonial,
      customerName: input.customerName,
      testimonial: input.testimonial,
      roleLabel: input.roleLabel,
      isActive: input.isActive,
      photoUrl: testimonial.photoUrl, // storage path -> URL resolution happens server-side on next full load; local edit keeps the existing preview
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete the testimonial from "${testimonial.customerName}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteTestimonial(testimonial.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDeleted();
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="flex flex-col gap-4 border border-border bg-surface-muted p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`t-name-${testimonial.id}`}>Customer Name</Label>
            <Input
              id={`t-name-${testimonial.id}`}
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor={`t-role-${testimonial.id}`}>Role Label</Label>
            <Input
              id={`t-role-${testimonial.id}`}
              value={form.roleLabel}
              onChange={(e) => set("roleLabel", e.target.value)}
              placeholder="Optional — e.g. Pemilik BMW M4"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`t-quote-${testimonial.id}`}>Testimonial</Label>
            <Textarea
              id={`t-quote-${testimonial.id}`}
              rows={3}
              value={form.testimonial}
              onChange={(e) => set("testimonial", e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <InlineImageUpload
              bucket={BUCKET}
              pathPrefix="testimonial-"
              currentUrl={testimonial.photoUrl}
              onUploaded={setPhotoStoragePath}
              label="Photo"
              hint="Optional. Without one, the customer's initials are shown instead."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id={`t-active-${testimonial.id}`}
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor={`t-active-${testimonial.id}`} className="mb-0">
              Active
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          {error && <span className="font-body text-[12px] text-primary">{error}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 border border-border bg-surface p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted">
        {testimonial.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={testimonial.photoUrl} alt={testimonial.customerName} className="h-full w-full object-cover" />
        ) : (
          <span className="font-body text-[11px] font-semibold text-muted">
            {testimonial.customerName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[13px] font-medium text-ink">
          {testimonial.customerName}
          {!testimonial.isActive && (
            <span className="ml-2 font-body text-[11px] uppercase tracking-[0.05em] text-muted-2">Inactive</span>
          )}
        </p>
        <p className="truncate font-body text-[12px] text-muted">{testimonial.testimonial}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" disabled={isFirst} onClick={() => onMove(-1)} aria-label="Move up" className="p-1.5 text-muted hover:text-ink disabled:opacity-30">
          <ChevronUp size={16} aria-hidden />
        </button>
        <button type="button" disabled={isLast} onClick={() => onMove(1)} aria-label="Move down" className="p-1.5 text-muted hover:text-ink disabled:opacity-30">
          <ChevronDown size={16} aria-hidden />
        </button>
        <button type="button" onClick={() => setEditing(true)} aria-label="Edit testimonial" className="p-1.5 text-muted hover:text-primary">
          <Pencil size={16} aria-hidden />
        </button>
        <button type="button" disabled={deleting} onClick={handleDelete} aria-label="Delete testimonial" className="p-1.5 text-muted hover:text-primary disabled:opacity-30">
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
      {error && <span className="font-body text-[12px] text-primary">{error}</span>}
    </div>
  );
}

/**
 * Website > Homepage > Testimonials (Phase 4 Batch 4.5). Each
 * testimonial saves/deletes/reorders independently — same reasoning as
 * Why Perkasa's benefit cards. Photo upload uses InlineImageUpload
 * (shared media architecture: browser -> Supabase Storage direct, the
 * resulting path is just a string field on the eventual create/update
 * call, never a File/FormData through a Server Action).
 */
export function HomepageTestimonialsForm({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<TestimonialFormState>(EMPTY_FORM);
  const [newPhotoPath, setNewPhotoPath] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= testimonials.length) return;
    const reordered = [...testimonials];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setTestimonials(reordered);
    reorderTestimonials(reordered.map((t, i) => ({ id: t.id, sortOrder: i + 1 })));
  }

  async function handleAddNew(e: FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    const input: TestimonialInput = {
      customerName: newForm.customerName,
      testimonial: newForm.testimonial,
      roleLabel: orNull(newForm.roleLabel),
      photoStoragePath: newPhotoPath,
      isActive: newForm.isActive,
    };
    const result = await createTestimonial(input);
    setAddSaving(false);
    if (result.error || !result.id) {
      setAddError(result.error ?? "Could not create testimonial.");
      return;
    }
    setTestimonials((prev) => [
      ...prev,
      {
        id: result.id!,
        customerName: input.customerName,
        testimonial: input.testimonial,
        roleLabel: input.roleLabel,
        photoUrl: null, // resolved from storage on next full page load
        sortOrder: prev.length + 1,
        isActive: input.isActive,
      },
    ]);
    setNewForm(EMPTY_FORM);
    setNewPhotoPath(null);
    setAddingNew(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-headline-sm text-ink">Testimonials</h2>
        <p className="mt-1.5 font-body text-[13px] text-muted">
          Only active testimonials appear on the homepage, in this order. Photo is optional — without
          one, the customer&apos;s initials are shown. With zero testimonials, the section is left off
          the homepage entirely.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {testimonials.length === 0 && !addingNew && (
          <p className="font-body text-[13px] text-muted-2">No testimonials yet — add one below.</p>
        )}
        {testimonials.map((item, index) => (
          <TestimonialRow
            key={item.id}
            testimonial={item}
            isFirst={index === 0}
            isLast={index === testimonials.length - 1}
            onMove={(direction) => move(index, direction)}
            onSaved={(updated) => setTestimonials((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
            onDeleted={() => setTestimonials((prev) => prev.filter((t) => t.id !== item.id))}
          />
        ))}

        {addingNew ? (
          <form onSubmit={handleAddNew} className="flex flex-col gap-4 border border-border bg-surface-muted p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="new-t-name">Customer Name</Label>
                <Input
                  id="new-t-name"
                  value={newForm.customerName}
                  onChange={(e) => setNewForm((f) => ({ ...f, customerName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-t-role">Role Label</Label>
                <Input
                  id="new-t-role"
                  value={newForm.roleLabel}
                  onChange={(e) => setNewForm((f) => ({ ...f, roleLabel: e.target.value }))}
                  placeholder="Optional — e.g. Pemilik BMW M4"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-t-quote">Testimonial</Label>
                <Textarea
                  id="new-t-quote"
                  rows={3}
                  value={newForm.testimonial}
                  onChange={(e) => setNewForm((f) => ({ ...f, testimonial: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <InlineImageUpload
                  bucket={BUCKET}
                  pathPrefix="testimonial-"
                  currentUrl={null}
                  onUploaded={setNewPhotoPath}
                  label="Photo"
                  hint="Optional. Without one, the customer's initials are shown instead."
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" size="sm" disabled={addSaving}>
                {addSaving ? "Adding…" : "Add Testimonial"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddingNew(false)}>
                Cancel
              </Button>
              {addError && <span className="font-body text-[12px] text-primary">{addError}</span>}
            </div>
          </form>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAddingNew(true)} className="self-start">
            <Plus size={14} aria-hidden />
            Add Testimonial
          </Button>
        )}
      </div>
    </div>
  );
}
