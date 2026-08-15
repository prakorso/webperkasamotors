import Link from "next/link";
import type { SocialContent } from "@/lib/types";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";

const TYPE_LABEL: Record<SocialContent["contentType"], string> = {
  STOCK: "Stock",
  REVIEW: "Review",
  REEL: "Reel",
  FEATURE: "Feature",
  NEWS: "News",
  OTHER: "Other",
};

interface ContentTableProps {
  items: SocialContent[];
  /** vehicleId -> display title, for the ones this admin session can see. */
  vehicleTitles: Record<string, string>;
}

export function ContentTable({ items, vehicleTitles }: ContentTableProps) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="px-4 py-3" />
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Caption
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Type
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Vehicle
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
              <td className="px-4 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden border border-border bg-surface-muted">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </td>
              <td className="max-w-[280px] px-4 py-3 font-body text-[13px] text-ink">
                <span className="line-clamp-2">{item.caption || "—"}</span>
              </td>
              <td className="px-4 py-3 font-body text-[13px] text-muted">
                {TYPE_LABEL[item.contentType]}
              </td>
              <td className="px-4 py-3 font-body text-[13px] text-muted">
                {item.vehicleId ? (vehicleTitles[item.vehicleId] ?? "Vehicle no longer available") : "Editorial"}
              </td>
              <td className="px-4 py-3">
                <ContentStatusBadge status={item.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link
                  href={`/admin/content/${item.id}`}
                  className="font-body text-[13px] font-medium text-primary hover:text-ink"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
