"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { VehicleMedia } from "@/lib/types";

/**
 * Opens on whichever photo is flagged isPrimary — not just media[0]
 * (the first item by sort_order). Those coincide by default (the first
 * upload becomes primary automatically), but sort_order and isPrimary
 * are independent: staff can manually set a different photo primary
 * without reordering it to the front, and this gallery needs to agree
 * with every other surface (vehicle cards, catalogue, homepage
 * featured, related vehicles) about which photo is "the" main image —
 * isPrimary is the single source of truth for that, not position.
 */
export function VehicleGallery({ media }: { media: VehicleMedia[] }) {
  const initialId = media.find((m) => m.isPrimary)?.id ?? media[0]?.id;
  const [activeId, setActiveId] = useState(initialId);
  const active = media.find((m) => m.id === activeId) ?? media[0];

  if (!active) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-surface-muted">
        <Image
          src={active.url}
          alt={active.altText}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          priority
          className="object-cover"
        />
      </div>
      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {media.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              aria-label={`Show ${item.altText}`}
              aria-pressed={item.id === active.id}
              className={cn(
                "relative aspect-[4/3] overflow-hidden border bg-surface-muted transition-colors",
                item.id === active.id ? "border-ink" : "border-border hover:border-muted"
              )}
            >
              <Image
                src={item.url}
                alt={item.altText}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
