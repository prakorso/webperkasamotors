"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VehicleMedia } from "@/lib/types";
import { VehicleLightbox } from "./vehicle-lightbox";

const MAX_THUMBNAILS = 3;

/**
 * Compact carousel — replaces the old "1 large photo + every remaining
 * photo as a full grid below" layout, which is what made the vehicle
 * detail page unnecessarily long with more than a few photos. Only ever
 * shows one large photo plus up to MAX_THUMBNAILS thumbnails; every
 * photo stays reachable via Previous/Next regardless of count.
 *
 * Opens on whichever photo is flagged isPrimary — not just media[0]
 * (the first item by sort_order). Those coincide by default (the first
 * upload becomes primary automatically), but sort_order and isPrimary
 * are independent: staff can manually set a different photo primary
 * without reordering it to the front, and this gallery needs to agree
 * with every other surface (vehicle cards, catalogue, homepage
 * featured, related vehicles) about which photo is "the" main image —
 * isPrimary is the single source of truth for that, not position. This
 * logic is unchanged from the previous gallery; only the presentation
 * around it changed.
 *
 * The thumbnail row is a sliding window (not a static first-3): as
 * activeIndex advances past what's currently visible, the window slides
 * forward with it, so the thumbnails always show "what's next" rather
 * than freezing on the first 3 photos forever.
 */
export function VehicleGallery({ media }: { media: VehicleMedia[] }) {
  const initialIndex = Math.max(
    0,
    media.findIndex((m) => m.isPrimary)
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const active = media[activeIndex];
  if (!active) return null;

  function goTo(index: number) {
    setActiveIndex((index + media.length) % media.length);
  }

  const windowStart = Math.max(0, Math.min(activeIndex, media.length - MAX_THUMBNAILS));
  const thumbnails = media.slice(windowStart, windowStart + MAX_THUMBNAILS);

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-surface-muted">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View ${active.altText || "photo"} fullscreen`}
          className="absolute inset-0 z-10 cursor-zoom-in"
        />
        <Image
          src={active.url}
          alt={active.altText}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          priority
          className="object-cover"
        />

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(activeIndex - 1);
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/80"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(activeIndex + 1);
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/80"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
            <span className="absolute bottom-3 right-3 z-20 rounded-full bg-ink/60 px-2.5 py-1 font-body text-[12px] tabular-nums text-paper">
              {activeIndex + 1} / {media.length}
            </span>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {thumbnails.map((item) => {
            const itemIndex = media.indexOf(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(itemIndex)}
                aria-label={`Show ${item.altText || "photo"}`}
                aria-pressed={itemIndex === activeIndex}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden border bg-surface-muted transition-colors",
                  itemIndex === activeIndex ? "border-ink" : "border-border hover:border-muted"
                )}
              >
                <Image src={item.url} alt={item.altText} fill sizes="20vw" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {lightboxOpen && (
        <VehicleLightbox media={media} initialIndex={activeIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
