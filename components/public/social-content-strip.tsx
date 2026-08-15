import Image from "next/image";
import type { SocialContent } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  STOCK: "Stock",
  REVIEW: "Review",
  REEL: "Reel",
  FEATURE: "Feature",
  NEWS: "News",
  OTHER: "Content",
};

/**
 * Instagram-sourced content linked to this vehicle — backed by the
 * `content` table (lib/data/social-content.ts), staff-managed via the
 * admin Content page since there's no automated ingestion yet.
 */
export function SocialContentStrip({ items }: { items: SocialContent[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center">
        <p className="font-body text-[13px] text-muted-2">No linked content yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.permalink}
          className="group block border border-border bg-surface"
        >
          <div className="relative aspect-square overflow-hidden bg-surface-muted">
            {item.thumbnailUrl ? (
              <Image
                src={item.thumbnailUrl}
                alt={item.caption}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
            <span className="absolute left-2 top-2 bg-ink px-2 py-1 font-body text-[10px] uppercase tracking-[0.08em] text-paper">
              {TYPE_LABEL[item.contentType] ?? item.contentType}
            </span>
          </div>
          <p className="line-clamp-2 p-3 font-body text-[13px] text-ink">{item.caption}</p>
        </a>
      ))}
    </div>
  );
}
