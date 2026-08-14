"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  reorderNavigationItems,
  type NavigationItemInput,
} from "@/lib/actions/navigation";
import type { NavigationItem, NavPlacement } from "@/lib/types";

interface NavigationManagerProps {
  placement: NavPlacement;
  initialItems: NavigationItem[];
  /** Footer nav groups only — Header/Footer Legal don't group items under a heading. */
  showGroupLabel?: boolean;
  /** CTA treatment is header-only in practice. */
  showCta?: boolean;
}

const EMPTY_DRAFT = {
  groupLabel: "",
  label: "",
  href: "",
  isVisible: true,
  isExternal: false,
  isCta: false,
};

/**
 * Shared by Header & Navigation and Footer's nav-group / legal-link
 * management — "add/edit/hide/show/reorder a link" is the same operation
 * regardless of which navigation_items placement it targets.
 */
export function NavigationManager({
  placement,
  initialItems,
  showGroupLabel = false,
  showCta = true,
}: NavigationManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
    setError(null);
  }

  function startEdit(item: NavigationItem) {
    setDraft({
      groupLabel: item.groupLabel ?? "",
      label: item.label,
      href: item.href,
      isVisible: item.isVisible,
      isExternal: item.isExternal,
      isCta: item.isCta,
    });
    setEditingId(item.id);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSave() {
    if (!draft.label.trim() || !draft.href.trim()) {
      setError("Label and URL are required.");
      return;
    }
    const input: NavigationItemInput = {
      placement,
      groupLabel: showGroupLabel ? draft.groupLabel.trim() || null : null,
      label: draft.label.trim(),
      href: draft.href.trim(),
      isVisible: draft.isVisible,
      isExternal: draft.isExternal,
      isCta: draft.isCta,
    };

    const wasNew = editingId === "new";
    const targetId = editingId;

    startTransition(async () => {
      const result = wasNew
        ? await createNavigationItem(input)
        : await updateNavigationItem(targetId as string, input);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (wasNew) {
        setItems((prev) => [
          ...prev,
          { id: crypto.randomUUID(), sortOrder: prev.length + 1, ...input },
        ]);
      } else {
        setItems((prev) => prev.map((i) => (i.id === targetId ? { ...i, ...input } : i)));
      }
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this navigation item?")) return;
    startTransition(async () => {
      const result = await deleteNavigationItem(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);

    startTransition(async () => {
      const result = await reorderNavigationItems(
        reordered.map((item, i) => ({ id: item.id, sortOrder: i + 1 }))
      );
      if (result.error) setError(result.error);
    });
  }

  const columns = showGroupLabel
    ? ["Group", "Label", "URL", "Flags", ""]
    : ["Label", "URL", "Flags", ""];

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="font-body text-[13px] text-primary">{error}</p>}

      <div className="overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left">
              {columns.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center font-body text-[13px] text-muted"
                >
                  No items yet.
                </td>
              </tr>
            )}
            {items.map((item, index) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-b-0 hover:bg-surface-muted"
              >
                {showGroupLabel && (
                  <td className="px-4 py-3 font-body text-[13px] text-muted">
                    {item.groupLabel ?? "—"}
                  </td>
                )}
                <td className="px-4 py-3 font-body text-[13px] font-medium text-ink">
                  {item.label}
                </td>
                <td className="px-4 py-3 font-body text-[13px] text-muted">{item.href}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {!item.isVisible && <Badge variant="neutral">Hidden</Badge>}
                    {item.isCta && <Badge variant="primary">CTA</Badge>}
                    {item.isExternal && <Badge variant="outline">External</Badge>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || pending}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                      className="p-1 text-muted hover:text-ink disabled:opacity-30"
                    >
                      <ChevronUp size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1 || pending}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                      className="p-1 text-muted hover:text-ink disabled:opacity-30"
                    >
                      <ChevronDown size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="px-2 py-1 font-body text-[12px] font-medium text-primary hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1 font-body text-[12px] font-medium text-muted hover:text-primary"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <div className="border border-border bg-surface p-6">
          <h3 className="mb-4 font-display text-headline-sm text-ink">
            {editingId === "new" ? "Add Item" : "Edit Item"}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showGroupLabel && (
              <div>
                <Label htmlFor="nav-group">Group Label</Label>
                <Input
                  id="nav-group"
                  value={draft.groupLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, groupLabel: e.target.value }))}
                  placeholder="e.g. Navigasi"
                />
              </div>
            )}
            <div>
              <Label htmlFor="nav-label">Label</Label>
              <Input
                id="nav-label"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="nav-href">URL</Label>
              <Input
                id="nav-href"
                value={draft.href}
                onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))}
                placeholder="/cars or https://…"
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 font-body text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={draft.isVisible}
                  onChange={(e) => setDraft((d) => ({ ...d, isVisible: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                Visible
              </label>
              <label className="flex items-center gap-2 font-body text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={draft.isExternal}
                  onChange={(e) => setDraft((d) => ({ ...d, isExternal: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                External link (opens in new tab)
              </label>
              {showCta && (
                <label className="flex items-center gap-2 font-body text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={draft.isCta}
                    onChange={(e) => setDraft((d) => ({ ...d, isCta: e.target.checked }))}
                    className="h-4 w-4 accent-primary"
                  />
                  CTA treatment
                </label>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button type="button" variant="primary" onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={startAdd} className="self-start">
          <Plus size={16} aria-hidden />
          Add Item
        </Button>
      )}
    </div>
  );
}
