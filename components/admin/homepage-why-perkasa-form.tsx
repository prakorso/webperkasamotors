"use client";

import { useState, type FormEvent } from "react";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  updateWhyPerkasaSection,
  type UpdateWhyPerkasaSectionInput,
} from "@/lib/actions/site-settings";
import {
  createHomepageBenefit,
  updateHomepageBenefit,
  deleteHomepageBenefit,
  reorderHomepageBenefits,
  type BenefitInput,
} from "@/lib/actions/homepage-benefits";
import { BENEFIT_ICON_OPTIONS, BENEFIT_ICON_MAP, DEFAULT_BENEFIT_ICON } from "@/lib/utils/benefit-icons";
import type { WebsiteSettings, HomepageBenefit } from "@/lib/types";

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

const HEADLINE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 500;

const EMPTY_BENEFIT_FORM = { title: "", description: "", icon: BENEFIT_ICON_OPTIONS[0].key, isActive: true };
type BenefitFormState = typeof EMPTY_BENEFIT_FORM;

/** One benefit row — collapsed summary, or an inline edit form when active. */
function BenefitRow({
  benefit,
  isFirst,
  isLast,
  onMove,
  onSaved,
  onDeleted,
}: {
  benefit: HomepageBenefit;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onSaved: (updated: HomepageBenefit) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BenefitFormState>({
    title: benefit.title,
    description: benefit.description,
    icon: benefit.icon ?? BENEFIT_ICON_OPTIONS[0].key,
    isActive: benefit.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = (benefit.icon && BENEFIT_ICON_MAP[benefit.icon]) || DEFAULT_BENEFIT_ICON;

  function set<K extends keyof BenefitFormState>(key: K, value: BenefitFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input: BenefitInput = {
      title: form.title,
      description: form.description,
      icon: form.icon,
      isActive: form.isActive,
    };
    const result = await updateHomepageBenefit(benefit.id, input);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    onSaved({ ...benefit, title: input.title, description: input.description, icon: input.icon, isActive: input.isActive });
  }

  async function handleDelete() {
    if (!confirm(`Delete the "${benefit.title}" benefit card? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteHomepageBenefit(benefit.id);
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
            <Label htmlFor={`benefit-title-${benefit.id}`}>Title</Label>
            <Input
              id={`benefit-title-${benefit.id}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor={`benefit-icon-${benefit.id}`}>Icon</Label>
            <select
              id={`benefit-icon-${benefit.id}`}
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              className="h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              {BENEFIT_ICON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`benefit-description-${benefit.id}`}>Description</Label>
            <Textarea
              id={`benefit-description-${benefit.id}`}
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id={`benefit-active-${benefit.id}`}
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor={`benefit-active-${benefit.id}`} className="mb-0">
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
      <Icon className="shrink-0 text-primary" size={20} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[13px] font-medium text-ink">
          {benefit.title}
          {!benefit.isActive && (
            <span className="ml-2 font-body text-[11px] uppercase tracking-[0.05em] text-muted-2">Inactive</span>
          )}
        </p>
        <p className="truncate font-body text-[12px] text-muted">{benefit.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          aria-label="Move up"
          className="p-1.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ChevronUp size={16} aria-hidden />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove(1)}
          aria-label="Move down"
          className="p-1.5 text-muted hover:text-ink disabled:opacity-30"
        >
          <ChevronDown size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit benefit"
          className="p-1.5 text-muted hover:text-primary"
        >
          <Pencil size={16} aria-hidden />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          aria-label="Delete benefit"
          className="p-1.5 text-muted hover:text-primary disabled:opacity-30"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
      {error && <span className="font-body text-[12px] text-primary">{error}</span>}
    </div>
  );
}

/**
 * Website > Homepage > Why Perkasa (Phase 4 Batch 4.4). Section header
 * (Active/Eyebrow/Headline/Description) saves as one unit via
 * updateWhyPerkasaSection; each benefit card saves/deletes/reorders
 * independently — editing one card was never meant to require
 * resubmitting the whole section, same reasoning as Vehicle Photos'
 * per-photo actions.
 */
export function HomepageWhyPerkasaForm({
  settings,
  initialBenefits,
}: {
  settings: WebsiteSettings;
  initialBenefits: HomepageBenefit[];
}) {
  const [sectionForm, setSectionForm] = useState({
    eyebrow: settings.whyPerkasa.eyebrow ?? "",
    headline: settings.whyPerkasa.headline ?? "",
    description: settings.whyPerkasa.description ?? "",
    isActive: settings.whyPerkasa.isActive,
  });
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [sectionSaved, setSectionSaved] = useState(false);

  const [benefits, setBenefits] = useState(initialBenefits);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<BenefitFormState>(EMPTY_BENEFIT_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function setSectionField<K extends keyof typeof sectionForm>(key: K, value: (typeof sectionForm)[K]) {
    setSectionForm((f) => ({ ...f, [key]: value }));
    setSectionSaved(false);
  }

  async function handleSectionSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSectionSaving(true);
    setSectionError(null);
    const input: UpdateWhyPerkasaSectionInput = {
      eyebrow: orNull(sectionForm.eyebrow),
      headline: orNull(sectionForm.headline),
      description: orNull(sectionForm.description),
      isActive: sectionForm.isActive,
    };
    const result = await updateWhyPerkasaSection(input);
    setSectionSaving(false);
    if (result.error) setSectionError(result.error);
    else setSectionSaved(true);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= benefits.length) return;
    const reordered = [...benefits];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBenefits(reordered);
    reorderHomepageBenefits(reordered.map((b, i) => ({ id: b.id, sortOrder: i + 1 })));
  }

  async function handleAddNew(e: FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    const input: BenefitInput = {
      title: newForm.title,
      description: newForm.description,
      icon: newForm.icon,
      isActive: newForm.isActive,
    };
    const result = await createHomepageBenefit(input);
    setAddSaving(false);
    if (result.error || !result.id) {
      setAddError(result.error ?? "Could not create benefit.");
      return;
    }
    setBenefits((prev) => [
      ...prev,
      { id: result.id!, title: input.title, description: input.description, icon: input.icon, sortOrder: prev.length + 1, isActive: input.isActive },
    ]);
    setNewForm(EMPTY_BENEFIT_FORM);
    setAddingNew(false);
  }

  return (
    // A plain div, not a <form> — the Benefit Cards panel below contains
    // its own <form> elements (add/edit), and HTML doesn't allow nested
    // forms. When it briefly was nested, clicking "Add Benefit" actually
    // submitted this component's *outer* form instead (browsers drop a
    // <form> start tag encountered while already inside one, so its
    // submit button silently binds to the enclosing form) — benefits
    // never got created. The Section fields get their own <form> below
    // instead, scoped to just that fieldset + its Save button.
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-headline-sm text-ink">Why Perkasa</h2>
        <p className="mt-1.5 font-body text-[13px] text-muted">
          A headline plus a row of benefit cards. If inactive, or there are no active benefit cards,
          the homepage shows its original default content instead of an empty section.
        </p>
      </div>

      <form onSubmit={handleSectionSubmit} className="flex flex-col gap-6">
      <Fieldset title="Section">
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="why-perkasa-active"
            type="checkbox"
            checked={sectionForm.isActive}
            onChange={(e) => setSectionField("isActive", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Label htmlFor="why-perkasa-active" className="mb-0">
            Active
          </Label>
        </div>
        <div>
          <Label htmlFor="why-perkasa-eyebrow">Eyebrow</Label>
          <Input
            id="why-perkasa-eyebrow"
            value={sectionForm.eyebrow}
            onChange={(e) => setSectionField("eyebrow", e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="why-perkasa-headline">Headline</Label>
          <Input
            id="why-perkasa-headline"
            value={sectionForm.headline}
            onChange={(e) => setSectionField("headline", e.target.value)}
            placeholder="Required while Active — e.g. Mengapa Perkasa Motors?"
            maxLength={HEADLINE_MAX_LENGTH}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="why-perkasa-description">Description</Label>
          <Textarea
            id="why-perkasa-description"
            rows={2}
            value={sectionForm.description}
            onChange={(e) => setSectionField("description", e.target.value)}
            placeholder="Optional"
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
        </div>
      </Fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={sectionSaving}>
          {sectionSaving ? "Saving…" : "Save Section"}
        </Button>
        {sectionSaved && <span className="font-body text-[13px] text-success">Saved.</span>}
        {sectionError && <span className="font-body text-[13px] text-primary">{sectionError}</span>}
      </div>
      </form>

      <div className="border border-border bg-surface p-6">
        <p className="mb-4 px-2 font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Benefit Cards
        </p>
        <div className="flex flex-col gap-2">
          {benefits.length === 0 && !addingNew && (
            <p className="font-body text-[13px] text-muted-2">No benefit cards yet — add one below.</p>
          )}
          {benefits.map((benefit, index) => (
            <BenefitRow
              key={benefit.id}
              benefit={benefit}
              isFirst={index === 0}
              isLast={index === benefits.length - 1}
              onMove={(direction) => move(index, direction)}
              onSaved={(updated) => setBenefits((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))}
              onDeleted={() => setBenefits((prev) => prev.filter((b) => b.id !== benefit.id))}
            />
          ))}

          {addingNew ? (
            <form onSubmit={handleAddNew} className="flex flex-col gap-4 border border-border bg-surface-muted p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="new-benefit-title">Title</Label>
                  <Input
                    id="new-benefit-title"
                    value={newForm.title}
                    onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-benefit-icon">Icon</Label>
                  <select
                    id="new-benefit-icon"
                    value={newForm.icon}
                    onChange={(e) => setNewForm((f) => ({ ...f, icon: e.target.value }))}
                    className="h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                  >
                    {BENEFIT_ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new-benefit-description">Description</Label>
                  <Textarea
                    id="new-benefit-description"
                    rows={2}
                    value={newForm.description}
                    onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={addSaving}>
                  {addSaving ? "Adding…" : "Add Benefit"}
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
              Add Benefit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
