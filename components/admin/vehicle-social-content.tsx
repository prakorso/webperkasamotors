"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SocialContent, SocialContentType, SocialContentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { createContent, type ContentInput } from "@/lib/actions/content";

const SELECT_CLASS =
  "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

const TYPE_LABEL: Record<SocialContentType, string> = {
  STOCK: "Stock",
  REVIEW: "Review",
  REEL: "Reel",
  FEATURE: "Feature",
  NEWS: "News",
  OTHER: "Other",
};

const EMPTY_FORM = {
  permalink: "",
  contentType: "STOCK" as SocialContentType,
  status: "INBOX" as SocialContentStatus,
  caption: "",
  postedAt: "",
};

/**
 * The primary workflow for managing a vehicle's linked Social Content —
 * lives on the Inventory edit page (see app/(admin)/admin/(shell)/
 * inventory/[id]/page.tsx), not the global /admin/content page. Shows
 * what's already linked and lets staff add a new item with vehicleId
 * fixed to this vehicle — the picker never appears here, so there's
 * nothing to re-select. Full edit/delete/status changes stay on
 * /admin/content/[id] (linked from each card below) — that page and the
 * global list remain the place for reviewing/editing/deleting everything,
 * per the split the user asked for.
 *
 * `items` is server-fetched and rendered directly rather than copied into
 * local state, so router.refresh() after a successful add — which
 * re-runs the server component tree — flows straight through as a fresh
 * prop instead of going stale behind a one-time useState seed.
 */
export function VehicleSocialContent({ vehicleId, items }: { vehicleId: string; items: SocialContent[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: ContentInput = {
      vehicleId,
      contentType: form.contentType,
      status: form.status,
      caption: form.caption,
      permalink: form.permalink,
      instagramMediaId: null,
      postedAt: form.postedAt || null,
    };

    const result = await createContent(input);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm(EMPTY_FORM);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted">No social content linked yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/content/${item.id}`}
              className="block border border-border bg-surface transition-colors hover:border-ink"
            >
              <div className="relative aspect-square overflow-hidden bg-surface-muted">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
                <span className="absolute left-1.5 top-1.5">
                  <ContentStatusBadge status={item.status} />
                </span>
              </div>
              <p className="line-clamp-2 p-2 font-body text-[12px] text-ink">
                {item.caption || TYPE_LABEL[item.contentType]}
              </p>
            </Link>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-border bg-surface p-4">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Add Social Content
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="vsc-permalink">Link</Label>
            <Input
              id="vsc-permalink"
              type="url"
              value={form.permalink}
              onChange={(e) => setForm((f) => ({ ...f, permalink: e.target.value }))}
              placeholder="https://www.instagram.com/p/…"
              required
            />
          </div>
          <div>
            <Label htmlFor="vsc-type">Type</Label>
            <select
              id="vsc-type"
              value={form.contentType}
              onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value as SocialContentType }))}
              className={SELECT_CLASS}
            >
              {(Object.keys(TYPE_LABEL) as SocialContentType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="vsc-status">Status</Label>
            <select
              id="vsc-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SocialContentStatus }))}
              className={SELECT_CLASS}
            >
              <option value="INBOX">Inbox</option>
              <option value="CLASSIFIED">Classified</option>
              <option value="PUBLISHED">Published</option>
              <option value="IGNORED">Ignored</option>
            </select>
          </div>
          <div>
            <Label htmlFor="vsc-postedAt">Posted Date</Label>
            <Input
              id="vsc-postedAt"
              type="date"
              value={form.postedAt}
              onChange={(e) => setForm((f) => ({ ...f, postedAt: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="vsc-caption">Caption</Label>
            <Textarea
              id="vsc-caption"
              rows={2}
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? "Adding…" : "Add Content"}
          </Button>
          {error && <span className="font-body text-[13px] text-primary">{error}</span>}
        </div>
      </form>
    </div>
  );
}
