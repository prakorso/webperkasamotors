"use client";

import Image from "next/image";
import { useState } from "react";
import { Car } from "lucide-react";

/** Fixed 4:5 thumbnail (same ratio as the public catalogue card). Falls back to a neutral placeholder when there is no photo or it fails to load. */
export function VehicleThumb({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-[60px] w-12 shrink-0 overflow-hidden rounded-[8px] bg-surface-muted">
      {src && !failed ? (
        // Decorative: the unit name sits in the next cell, so alt text would only duplicate it for screen readers.
        <Image src={src} alt="" width={96} height={120} sizes="48px" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted">
          <Car className="size-4" aria-hidden />
          <span className="text-[9px] leading-none">Tidak ada foto</span>
        </div>
      )}
    </div>
  );
}
