import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Shared Previous/Next + page-number pagination — used by the vehicle
 * catalogue (/cars, /motorcycles) and the Articles listing (/articles).
 * Server-rendered links (no client JS required to page through results),
 * so it degrades to plain navigation and stays crawlable/SEO-friendly.
 *
 * `basePath` is the page's own path (e.g. "/cars"); `extraParams` lets a
 * caller preserve any other query params it already has (none exist on
 * either catalogue page today, but the ?page= param is built the same
 * way any future filter would need to be, rather than hardcoding just
 * "?page=").
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  extraParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function href(targetPage: number): string {
    const params = new URLSearchParams(extraParams);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // Compact window: first, last, current, and one neighbor on each side —
  // avoids a very long row of page numbers once inventory/articles grow.
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 lg:mt-14">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        rel={page > 1 ? "prev" : undefined}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(
          "flex h-11 w-11 items-center justify-center border border-border font-body text-body text-ink transition-colors hover:border-ink",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft size={18} aria-hidden />
        <span className="sr-only">Previous page</span>
      </Link>

      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - sorted[i - 1] > 1 && (
            <span className="px-1 font-body text-body text-muted-2">…</span>
          )}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-11 w-11 items-center justify-center border font-body text-body transition-colors",
              p === page
                ? "border-ink bg-ink text-paper"
                : "border-border text-ink hover:border-ink"
            )}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        rel={page < totalPages ? "next" : undefined}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={cn(
          "flex h-11 w-11 items-center justify-center border border-border font-body text-body text-ink transition-colors hover:border-ink",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        <ChevronRight size={18} aria-hidden />
        <span className="sr-only">Next page</span>
      </Link>
    </nav>
  );
}
