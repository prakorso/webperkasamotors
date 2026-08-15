"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SocialContent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { addSocialContent } from "@/lib/actions/content";

/**
 * The primary workflow for managing a vehicle's linked Social Content —
 * lives on the Inventory edit page (see app/(admin)/admin/(shell)/
 * inventory/[id]/page.tsx), not the Content Library. One field: paste a
 * URL, click Add. vehicleId is a fixed prop, wired straight into
 * addSocialContent — there's nothing to select, so nothing is asked.
 * Everything else (platform detection, thumbnail retrieval, caption) is
 * derived automatically server-side; see lib/actions/content.ts.
 *
 * Fixing a wrong link, changing the caption, or hiding an item stays on
 * /admin/content/[id] (linked from each card below) — the Library is
 * still where full editing happens, just not creation.
 *
 * `items` is server-fetched and rendered directly rather than copied into
 * local state, so router.refresh() after a successful add — which
 * re-runs the server component tree — flows straight through as a fresh
 * prop instead of going stale behind a one-time useState seed.
 */
export function VehicleSocialContent({ vehicleId, items }: { vehicleId: string; items: SocialContent[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await addSocialContent(vehicleId, url);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUrl("");
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
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-body text-[10px] uppercase tracking-[0.06em] text-muted-2">
                      No preview
                    </span>
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5">
                  <ContentStatusBadge status={item.status} />
                </span>
              </div>
              {item.caption && (
                <p className="line-clamp-2 p-2 font-body text-[12px] text-ink">{item.caption}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border border-border bg-surface p-4">
        <div className="min-w-[240px] flex-1">
          <Label htmlFor="vsc-url">Social Media URL</Label>
          <Input
            id="vsc-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? "Adding…" : "Add Content"}
        </Button>
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </form>
    </div>
  );
}
