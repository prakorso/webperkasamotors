"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { VehicleMedia } from "@/lib/types";
import { VehicleLightbox } from "./vehicle-lightbox";

const MAX_THUMBNAILS = 4;

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
 *
 * The uploaded showroom photography is predominantly portrait 4:5. The
 * primary frame follows that ratio and uses object-contain so the vehicle
 * remains fully legible instead of being cropped into a landscape slot.
 * Compact 4:3 thumbnails keep the gallery controls from adding a second
 * tall image row beneath the dominant photograph.
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
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] border border-border/80 bg-surface-muted shadow-[0_18px_50px_rgba(17,19,21,0.08)]">
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
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-contain"
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
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] bg-ink/55 text-paper shadow-lg backdrop-blur-[2px] transition-colors hover:bg-ink/80"
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
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] bg-ink/55 text-paper shadow-lg backdrop-blur-[2px] transition-colors hover:bg-ink/80"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
            <span className="absolute bottom-4 right-4 z-20 rounded-[9px] bg-ink/65 px-2.5 py-1 font-body text-[12px] tabular-nums text-paper backdrop-blur-[2px]">
              {activeIndex + 1} / {media.length}
            </span>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2.5 sm:gap-3">
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
                  "relative aspect-[4/3] overflow-hidden rounded-[12px] border bg-surface-muted transition-[border-color,box-shadow] duration-200",
                  itemIndex === activeIndex ? "border-ink shadow-[0_8px_24px_rgba(17,19,21,0.1)]" : "border-border hover:border-muted"
                )}
              >
                <Image src={item.url} alt={item.altText} fill sizes="(min-width: 1024px) 12vw, 25vw" className="object-cover" />
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
