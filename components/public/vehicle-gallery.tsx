"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { VehicleMedia } from "@/lib/types";

export function VehicleGallery({ media }: { media: VehicleMedia[] }) {
  const [activeId, setActiveId] = useState(media[0]?.id);
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
